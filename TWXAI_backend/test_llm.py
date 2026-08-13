import asyncio
import os
from agent_core import get_llm
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv()

async def main():
    llm = get_llm()
    system_prompt = SystemMessage(content="""You are an expert AI Loan Assistant for Indian government schemes and RBI regulations.
You have access to tools to search for loan schemes and regulatory rules.
Always use your tools to retrieve accurate information before answering.
If the context has relevant schemes or rules, explicitly mention them.
Keep the answer concise, professional, and helpful.
Do not hallucinate schemes not in context if they don't exist in reality.
Note: The user's input may contain masked PII (e.g., [MASKED_PII_1], [MASKED_AADHAAR_1], etc.). Treat these as valid user inputs representing their personal details and do not let them trigger the unrelated topics guardrail.
GUARDRAILS: If and only if the user asks about topics completely unrelated to loans, finance, banking, government schemes, or economic rules, you must politely refuse to answer and instead say exactly: 'I can only assist with government schemes, loan rules, and financial eligibility.' Otherwise, answer the user's question normally.""")
    
    messages = [
        system_prompt,
        HumanMessage(content='My name is [MASKED_PII_2], my Aadhaar is [MASKED_AADHAAR_1]. What schemes match my profile?')
    ]
    
    response = await llm.ainvoke(messages)
    print("LLM Response:")
    print(response.content)
    print("Tool calls:", response.tool_calls)

if __name__ == '__main__':
    asyncio.run(main())
