import os
import sys
import json
from typing import Dict, Any, List
from pydantic import BaseModel, Field

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.llm_factory import get_llm_client

class DocumentSummary(BaseModel):
    title: str = Field(description="Title or theme of the document")
    topic: str = Field(description="High-level category")
    key_findings: List[str] = Field(description="3 distinct bullet points")
    confidence_score: float = Field(description="Confidence between 0.0 and 1.0")

def get_current_weather(location: str, unit: str = "celsius") -> str:
    return f"Weather in {location}: 22 deg {unit[0].upper()}, Partly Cloudy with 15km/h wind."

def execute_calculator(expression: str) -> str:
    try:
        allowed = set("0123456789+-*/(). ")
        if all(c in allowed for c in expression):
            return str(eval(expression))
        return "Error: Invalid math expression"
    except Exception as e:
        return f"Calculation error: {e}"

TOOLS_REGISTRY = {
    "get_current_weather": get_current_weather,
    "calculator": execute_calculator
}

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get current live weather for a specific city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City and State/Country, e.g. San Francisco, CA"},
                    "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
                },
                "required": ["location"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Calculate math expressions accurately.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Mathematical expression like 42 * 100"}
                },
                "required": ["expression"]
            }
        }
    }
]

def run_lab_03():
    print("=" * 70)
    print("[LAB 03] STRUCTURED JSON OUTPUTS & TOOL CALLING")
    print("=" * 70)

    client = get_llm_client()

    # 1. Structured JSON Extraction
    print("\n--- 1. Enforcing Structured JSON Output ---")
    raw_article = (
        "Retrieval-Augmented Generation (RAG) combines dense vector retrieval with autoregressive LLMs. "
        "It dramatically reduces hallucinations and allows real-time knowledge updates without expensive fine-tuning. "
        "Benchmark evaluations show a 40% improvement in domain factual accuracy."
    )

    schema_def = DocumentSummary.model_json_schema()
    print(f"Target Pydantic Schema:\n{json.dumps(schema_def, indent=2)}\n")

    json_messages = [
        {"role": "system", "content": f"Extract the information into strict JSON following schema: {json.dumps(schema_def)}"},
        {"role": "user", "content": raw_article}
    ]

    res = client.generate(messages=json_messages, temperature=0.1, response_format={"type": "json_object"})
    print("Structured Output Received:")
    print(res.content)

    # 2. Function / Tool Calling Lifecycle
    print("\n--- 2. Function / Tool Calling Lifecycle ---")
    user_query = "What is the current weather in San Francisco, CA and calculate 42 * 100?"
    print(f"User Query: \"{user_query}\"")

    tool_messages = [
        {"role": "system", "content": "You have access to tools. Call the appropriate tools when needed."},
        {"role": "user", "content": user_query}
    ]

    initial_res = client.generate(messages=tool_messages, tools=TOOLS_SCHEMA)
    print(f"Finish Reason: {initial_res.finish_reason}")

    if initial_res.tool_calls:
        print(f"\nTool Calls Emitted by LLM: {len(initial_res.tool_calls)}")
        for tc in initial_res.tool_calls:
            fn_name = tc["function"]["name"]
            fn_args = json.loads(tc["function"]["arguments"]) if isinstance(tc["function"]["arguments"], str) else tc["function"]["arguments"]
            print(f"  -> Executing Tool: `{fn_name}` with args: {fn_args}")

            # Execute real python function
            if fn_name in TOOLS_REGISTRY:
                result = TOOLS_REGISTRY[fn_name](**fn_args)
                print(f"  <- Tool Result: {result}")

    print("\n[OK] Lab 03 completed successfully!")

if __name__ == "__main__":
    run_lab_03()
