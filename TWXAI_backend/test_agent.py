import asyncio
import os
from fastapi_backend import search_knowledge_base
import agent_core
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

async def main():
    agent_core.initialize_tools(search_knowledge_base)
    agent = agent_core.get_agent()
    
    from observability_config import get_telemetry_handler
    handler = get_telemetry_handler()
    
    config = {
        "configurable": {"thread_id": "test_session_1"},
        "metadata": {
            "langfuse_session_id": "test_session_1"
        }
    }
    if handler:
        config["callbacks"] = [handler]
        
    print("User: I am looking for a tractor loan for farmers.")
    response = await agent.ainvoke({"messages": [("user", "I am looking for a tractor loan for farmers.")], "reflection_count": 0, "needs_correction": False}, config)
    safe_content = response['messages'][-1].content.replace('₹', 'Rs.').encode('ascii', errors='replace').decode('ascii')
    print(f"Agent: {safe_content}")
    
    print("\nUser: What was the loan I just asked about?")
    response2 = await agent.ainvoke({"messages": [("user", "What was the loan I just asked about?")], "reflection_count": 0, "needs_correction": False}, config)
    safe_content2 = response2['messages'][-1].content.replace('₹', 'Rs.').encode('ascii', errors='replace').decode('ascii')
    print(f"Agent: {safe_content2}")

if __name__ == "__main__":
    asyncio.run(main())
