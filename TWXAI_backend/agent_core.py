import os
import json
import logging
import asyncio
from typing import List, Dict, Any, TypedDict, Annotated, Sequence
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# pyrefly: ignore [missing-import]
from langchain_core.tools import tool
# pyrefly: ignore [missing-import]
from langchain_openai import ChatOpenAI
# pyrefly: ignore [missing-import]
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage, ToolMessage
# pyrefly: ignore [missing-import]
from langgraph.graph import StateGraph, START, END
# pyrefly: ignore [missing-import]
from langgraph.graph.message import add_messages
# pyrefly: ignore [missing-import]
from langgraph.prebuilt import ToolNode
# pyrefly: ignore [missing-import]
from langgraph.checkpoint.memory import MemorySaver

logger = logging.getLogger(__name__)

# Semver Prompt Identifier for LLMOps version tracking
PROMPT_VERSION = "v1.2.0"

# Reference to search_knowledge_base to avoid circular imports
_search_knowledge_base_ref = None

def initialize_tools(search_fn):
    global _search_knowledge_base_ref
    _search_knowledge_base_ref = search_fn

@tool
def search_loan_schemes(query: str) -> str:
    """
    Search the local knowledge base for government loan schemes matching the user's query.
    Use this to find information about PMAY, MUDRA, Stand-Up India, Kisan Credit Card, etc.
    """
    if _search_knowledge_base_ref is None:
        return "Tool not initialized."
    
    context, schemes, _ = _search_knowledge_base_ref(query)
    if not context:
        return "No relevant schemes found."
    return f"Context:\n{context}\n\nRelated Scheme IDs: {schemes}"

@tool
def search_regulatory_rules(query: str) -> str:
    """
    Search the local knowledge base for RBI or banking regulatory rules matching the query.
    Use this to find rules about CIBIL scores, DTI, limits, and eligibility criteria.
    """
    if _search_knowledge_base_ref is None:
        return "Tool not initialized."
    
    context, _, rules = _search_knowledge_base_ref(query)
    if not context:
        return "No relevant rules found."
    return f"Context:\n{context}\n\nRelated Rule IDs: {rules}"

async def parallel_search_tools(query: str) -> Dict[str, str]:
    """
    Executes independent retrieval tools in parallel using asyncio.gather
    to reduce overall node latency (PDF Section 2: Parallel execution).
    """
    loop = asyncio.get_event_loop()
    schemes_task = loop.run_in_executor(None, search_loan_schemes.invoke, {"query": query})
    rules_task = loop.run_in_executor(None, search_regulatory_rules.invoke, {"query": query})
    
    schemes_res, rules_res = await asyncio.gather(schemes_task, rules_task)
    return {
        "schemes": schemes_res,
        "rules": rules_res
    }

# Checkpointer memory
memory = MemorySaver()

# --- State Schema ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    reflection_count: int
    needs_correction: bool
    plan: List[str]
    current_step: int
    requires_human_approval: bool

# Initialize LLM
def get_llm():
    nvidia_api_key = os.getenv("NVIDIA_API_KEY")
    if not nvidia_api_key:
        logger.warning("NVIDIA_API_KEY not found. Agent will use fallback mock response if remote fails.")
    
    return ChatOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=nvidia_api_key or "dummy",
        model="meta/llama-3.2-11b-vision-instruct",
        temperature=0.2,
        max_tokens=2048,
        request_timeout=30.0
    )

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True
)
async def invoke_llm_with_retry(llm, messages_payload):
    """Executes model call with exponential backoff retry (PDF Section 1 & 3: Retry)."""
    return await llm.ainvoke(messages_payload)

# 1. PLANNER NODE (PDF Section 1: Has a planner & Section 2: LangGraph nodes)
async def planner_node(state: AgentState):
    """
    Analyzes user requirements and sets an explicit multi-step plan before tool execution.
    """
    logger.info("Executing Planner Node...")
    messages = state.get("messages", [])
    user_query = ""
    for m in reversed(messages):
        if isinstance(m, HumanMessage) or getattr(m, 'type', '') == 'human':
            user_query = str(m.content)
            break
            
    # Check for high-risk action requiring human approval (Section 1: Human approval)
    high_risk_terms = ["override", "bypass rule", "waive requirement", "force approve", "ignore cibil", "manual approval"]
    requires_human = any(term in user_query.lower() for term in high_risk_terms)
    
    # Formulate plan based on query characteristics
    plan = []
    if any(w in user_query.lower() for w in ["mudra", "pmay", "scheme", "subsidy", "farm", "women"]):
        plan.append("search_loan_schemes")
    if any(w in user_query.lower() for w in ["cibil", "score", "dti", "income", "eligibility", "rbi", "rule"]):
        plan.append("search_regulatory_rules")
    if not plan:
        plan = ["search_loan_schemes", "search_regulatory_rules"]
        
    plan.append("synthesize_grounded_response")
    
    logger.info(f"Generated Plan: {plan} | High-Risk Human Approval Needed: {requires_human}")
    return {
        "plan": plan,
        "current_step": 0,
        "requires_human_approval": requires_human
    }

# 2. AGENT EXECUTION NODE
async def agent_node(state: AgentState):
    logger.info("Executing Agent Node...")
    llm = get_llm()
    tools = [search_loan_schemes, search_regulatory_rules]
    llm_with_tools = llm.bind_tools(tools)
    
    messages = state.get("messages", [])
    plan = state.get("plan", [])
    requires_human = state.get("requires_human_approval", False)
    
    # If high-risk override detected, inform user human verification is required
    if requires_human:
        approval_msg = AIMessage(
            content="⚠️ **High-Risk Action Detected**: Requests for policy overrides, CIBIL waivers, or manual rule bypasses require verified Human Credit Officer approval under RBI fair lending governance. Please submit an official override request via the Human Approval panel (/admin/approval/loan-override)."
        )
        return {"messages": [approval_msg]}
    
    system_prompt = SystemMessage(content=f"""[Prompt Version: {PROMPT_VERSION}]
You are an expert AI Loan Assistant for Indian government schemes and RBI regulations.
You have access to tools to search for loan schemes and regulatory rules.
Current Plan: {', '.join(plan)}
Always use your tools to retrieve accurate information before answering.
If the context has relevant schemes or rules, explicitly mention them.
Keep the answer concise, professional, and helpful.
Do not hallucinate schemes not in context if they don't exist in reality.
Note: The user's input may contain masked PII (e.g., [MASKED_PII_1], [MASKED_AADHAAR_1], etc.). Treat these as valid user inputs representing their personal details and do not let them trigger the unrelated topics guardrail.
GUARDRAILS: If the user asks about topics completely unrelated to loans, finance, banking, government schemes, or economic rules, REFUSE to answer politely.
Say: 'I can only assist with government schemes, loan rules, and financial eligibility.'""")
    
    try:
        response = await invoke_llm_with_retry(llm_with_tools, [system_prompt] + list(messages))
    except Exception as e:
        logger.error(f"Remote LLM Call Failed after retries: {e}")
        # Fallback response
        response = AIMessage(content="I am currently experiencing connectivity issues reaching the AI inference service. However, verified government schemes including PMAY, MUDRA, and Stand-Up India are active and accessible via our official catalog.")
        
    return {"messages": [response]}

# Prebuilt ToolNode
tools_node = ToolNode([search_loan_schemes, search_regulatory_rules])

# 3. REFLECTION & SELF-CORRECTION NODE (PDF Section 1: Reflection & Section 7: Grounding)
async def reflection_node(state: AgentState):
    logger.info("Executing Reflection Node...")
    llm = get_llm()
    messages = state.get("messages", [])
    if not messages:
        return {"needs_correction": False}
        
    last_message = messages[-1]
    
    # 1. Gather all tool context retrieved in the conversation
    tool_contents = []
    for msg in messages:
        if isinstance(msg, ToolMessage):
            tool_contents.append(msg.content)
            
    # If no tools were called, skip grounding check
    if not tool_contents:
        logger.info("No tool contexts found. Grounding check skipped.")
        return {"needs_correction": False}
        
    # 2. Call LLM to evaluate compliance and grounding
    context_str = "\n\n---\n".join(tool_contents)
    reflection_prompt = f"""
You are an independent Compliance and Grounding Auditor.
Analyze the Assistant's final response and compare it against the retrieved search context.

Retrieved Search Context:
{context_str}

Assistant's Response:
{last_message.content}

Evaluate if the Assistant's response contains any hallucinations, ungrounded claims, or fabricated eligibility rules that are NOT present in the retrieved context.
Return your evaluation in strict JSON format:
{{
  "is_grounded": true/false,
  "critique": "Explanation of the grounding violation, or empty if correct."
}}
Ensure you output ONLY the raw JSON block, nothing else. Do not add markdown backticks.
"""
    
    try:
        response = await invoke_llm_with_retry(llm, [HumanMessage(content=reflection_prompt)])
        content = response.content.strip()
        
        # Clean markdown if returned
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        data = json.loads(content)
        is_grounded = data.get("is_grounded", True)
        critique = data.get("critique", "")
    except Exception as e:
        logger.warning(f"Failed to parse reflection JSON: {e}. Defaulting to grounded.")
        is_grounded = True
        critique = ""
        
    current_count = state.get("reflection_count", 0)
    
    if not is_grounded and current_count < 2:
        logger.warning(f"⚠️ Self-Correction triggered (Attempt {current_count + 1}). Critique: {critique}")
        
        # Dynamic import to avoid circular dependency
        try:
            from fastapi_backend import supabase
            if supabase:
                supabase.table("mlops_logs").insert({
                    "event_type": "system_info",
                    "model_version": f"meta/llama-3.2-11b-vision-instruct:{PROMPT_VERSION}",
                    "details": {
                        "alert_type": "reflection_alert",
                        "attempt": current_count + 1,
                        "critique": critique,
                        "assistant_response": str(last_message.content)[:500]
                    },
                    "severity": "warning"
                }).execute()
        except Exception as e:
            logger.error(f"Failed to log reflection alert: {e}")
            
        corrective_message = SystemMessage(
            content=f"Compliance Check Failed: {critique}. Please rewrite your previous response. Ensure you ONLY use the verified information from the context. Do not make up or assume any eligibility numbers, parameters, or schemes."
        )
        return {
            "needs_correction": True,
            "reflection_count": current_count + 1,
            "messages": [corrective_message]
        }
        
    return {"needs_correction": False}

# Routing Conditions
def should_continue(state: AgentState):
    if state.get("requires_human_approval", False):
        return "end"
    messages = state.get("messages", [])
    last_message = messages[-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    return "reflect"

def should_loop(state: AgentState):
    if state.get("needs_correction", False) and state.get("reflection_count", 0) < 2:
        return "agent"
    return "end"

# Graph Construction
def get_agent():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("reflect", reflection_node)
    
    # Add edges
    workflow.add_edge(START, "planner")
    workflow.add_edge("planner", "agent")
    workflow.add_conditional_edges(
        "agent", 
        should_continue, 
        {"tools": "tools", "reflect": "reflect", "end": END}
    )
    workflow.add_edge("tools", "agent")
    workflow.add_conditional_edges(
        "reflect",
        should_loop,
        {"agent": "agent", "end": END}
    )
    
    return workflow.compile(checkpointer=memory)
