import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Support running from root or from backend folder
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..", "backend")))

from app.core.llm_factory import get_llm_client

def run_lab_01():
    print("=" * 70)
    print("[LAB 01] LLM APIs & PROMPT ENGINEERING FOUNDATIONS")
    print("=" * 70)

    client = get_llm_client()

    # 1. System Role vs User Role
    print("\n--- 1. Testing System Role Steering ---")
    system_instruction = "You are a concise cybersecurity auditor. Answer in 2 bullet points."
    user_prompt = "Why should we enforce MFA across all corporate accounts?"

    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": user_prompt}
    ]

    response = client.generate(messages=messages, temperature=0.3)
    print(f"Prompt: '{user_prompt}'")
    print(f"System Role: '{system_instruction}'")
    print(f"Response:\n{response.content}")
    print(f"Tokens Used: Input={response.input_tokens}, Output={response.output_tokens}, Latency={response.latency_ms}ms")

    # 2. Few-Shot In-Context Learning
    print("\n--- 2. Few-Shot In-Context Learning ---")
    few_shot_messages = [
        {"role": "system", "content": "Classify the sentiment of financial headlines into: Bullish, Bearish, or Neutral."},
        {"role": "user", "content": "Company reports record Q3 earnings exceeding estimates."},
        {"role": "assistant", "content": "Bullish"},
        {"role": "user", "content": "Supply chain disruptions delay new product launch by 6 months."},
        {"role": "assistant", "content": "Bearish"},
        {"role": "user", "content": "Central bank keeps benchmark interest rate unchanged as expected."},
        {"role": "assistant", "content": "Neutral"},
        {"role": "user", "content": "FDA approves breakthrough cancer therapy from biotech firm."}
    ]

    few_shot_response = client.generate(messages=few_shot_messages, temperature=0.1)
    print("Few-Shot Classification Result:")
    print(f"Target: 'FDA approves breakthrough cancer therapy from biotech firm.'")
    print(f"Predicted Class: {few_shot_response.content.strip()}")

    # 3. Chain-of-Thought (CoT) Reasoning
    print("\n--- 3. Chain-of-Thought (CoT) Prompting ---")
    cot_prompt = (
        "Solve this step-by-step:\n"
        "A vector database currently holds 1,000,000 vectors. Each vector is 768 dimensions (float32, 4 bytes per float). "
        "What is the total raw RAM required to store these vectors in uncompressed float32 format?"
    )

    cot_messages = [
        {"role": "system", "content": "You are a technical systems engineer. Think step-by-step before giving the final answer."},
        {"role": "user", "content": cot_prompt}
    ]

    cot_response = client.generate(messages=cot_messages, temperature=0.2)
    print(f"CoT Response:\n{cot_response.content}")
    print("\n[OK] Lab 01 completed successfully!")

if __name__ == "__main__":
    run_lab_01()
