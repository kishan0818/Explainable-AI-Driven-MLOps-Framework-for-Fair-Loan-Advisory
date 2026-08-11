import os
import logging
from typing import List, Dict, Any

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
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

def get_agent():
    # Use NVIDIA API with OpenAI compatible endpoint
    nvidia_api_key = os.getenv("NVIDIA_API_KEY")
    
    if not nvidia_api_key:
        logger.warning("NVIDIA_API_KEY not found. Agent will not work properly.")
    
    # We use meta/llama-3.1-70b-instruct for excellent tool calling
    llm = ChatOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=nvidia_api_key or "dummy",
        model="meta/llama-3.1-70b-instruct",
        temperature=0.2,
        max_tokens=2048
    )
    
    tools = [search_loan_schemes, search_regulatory_rules]
    
    # Create the React Agent with memory
    agent = create_react_agent(
        llm, 
        tools=tools, 
        checkpointer=memory,
        prompt="""You are an expert AI Loan Assistant for Indian government schemes and RBI regulations.
You have access to tools to search for loan schemes and regulatory rules.
Always use your tools to retrieve accurate information before answering.
If the context has relevant schemes or rules, explicitly mention them.
Keep the answer concise, professional, and helpful.
Do not hallucinate schemes not in context if they don't exist in reality.
GUARDRAILS: If the user asks about topics completely unrelated to loans, finance, banking, government schemes, or economic rules, REFUSE to answer politely.
Say: 'I can only assist with government schemes, loan rules, and financial eligibility.'"""
    )
    
    return agent
