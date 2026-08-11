import os
import json
import logging
from typing import List, Dict, Any, TypedDict, Annotated, Sequence
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

# Reference to the search_knowledge_base function from fastapi_backend
# to avoid circular imports.
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

# Set up the memory saver
memory = MemorySaver()

# --- Custom LangGraph Graph for Self-Correction & Reflection ---

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    reflection_count: int
    needs_correction: bool

# Initialize LLM
def get_llm():
    nvidia_api_key = os.getenv("NVIDIA_API_KEY")
    if not nvidia_api_key:
        logger.warning("NVIDIA_API_KEY not found. Agent will not work properly.")
    
    return ChatOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=nvidia_api_key or "dummy",
        model="meta/llama-3.1-70b-instruct",
        temperature=0.2,
        max_tokens=2048
    )

async def agent_node(state: AgentState):
    logger.info("Executing Agent Node...")
    llm = get_llm()
    tools = [search_loan_schemes, search_regulatory_rules]
    llm_with_tools = llm.bind_tools(tools)
    
    messages = state.get("messages", [])
    
    system_prompt = SystemMessage(content="""You are an expert AI Loan Assistant for Indian government schemes and RBI regulations.
You have access to tools to search for loan schemes and regulatory rules.
Always use your tools to retrieve accurate information before answering.
If the context has relevant schemes or rules, explicitly mention them.
Keep the answer concise, professional, and helpful.
Do not hallucinate schemes not in context if they don't exist in reality.
GUARDRAILS: If the user asks about topics completely unrelated to loans, finance, banking, government schemes, or economic rules, REFUSE to answer politely.
Say: 'I can only assist with government schemes, loan rules, and financial eligibility.'""")
    
    response = await llm_with_tools.ainvoke([system_prompt] + list(messages))
    return {"messages": [response]}

# Prebuilt ToolNode
tools_node = ToolNode([search_loan_schemes, search_regulatory_rules])

async def reflection_node(state: AgentState):
    logger.info("Executing Reflection Node...")
    llm = get_llm()
    messages = state.get("messages", [])
    last_message = messages[-1]
    
    # 1. Gather all tool context retrieved in the conversation
    tool_contents = []
    for msg in messages:
        if isinstance(msg, ToolMessage):
            tool_contents.append(msg.content)
            
    # If no tools were called, it's either chit-chat or direct answer. No grounding check needed.
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
        response = await llm.ainvoke([HumanMessage(content=reflection_prompt)])
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
                    "model_version": "meta/llama-3.1-70b-instruct",
                    "details": {
                        "alert_type": "reflection_alert",
                        "attempt": current_count + 1,
                        "critique": critique,
                        "assistant_response": last_message.content[:500]
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

def should_continue(state: AgentState):
    messages = state.get("messages", [])
    last_message = messages[-1]
    if last_message.tool_calls:
        return "tools"
    return "reflect"

def should_loop(state: AgentState):
    if state.get("needs_correction", False) and state.get("reflection_count", 0) < 2:
        return "agent"
    return "end"

def get_agent():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("reflect", reflection_node)
    
    # Add edges
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges(
        "agent", 
        should_continue, 
        {"tools": "tools", "reflect": "reflect"}
    )
    workflow.add_edge("tools", "agent")
    workflow.add_conditional_edges(
        "reflect",
        should_loop,
        {"agent": "agent", "end": END}
    )
    
    return workflow.compile(checkpointer=memory)
