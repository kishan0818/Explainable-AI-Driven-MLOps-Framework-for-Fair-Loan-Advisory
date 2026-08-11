import asyncio
import os
from fastapi_backend import search_knowledge_base
import agent_core
from dotenv import load_dotenv

load_dotenv()

async def main():
    agent_core.initialize_tools(search_knowledge_base)
    agent = agent_core.get_agent()
    
    config = {"configurable": {"thread_id": "test_session_1"}}
    
    print("User: I am looking for a tractor loan for farmers.")
    response = agent.invoke({"messages": [("user", "I am looking for a tractor loan for farmers.")]}, config)
    print(f"Agent: {response['messages'][-1].content}")
    
    print("\nUser: What was the loan I just asked about?")
    response2 = agent.invoke({"messages": [("user", "What was the loan I just asked about?")]}, config)
    print(f"Agent: {response2['messages'][-1].content}")

if __name__ == "__main__":
    asyncio.run(main())
