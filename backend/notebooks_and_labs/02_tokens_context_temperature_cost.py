import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(current_dir, "..", "..", "backend")))

from app.core.token_counter import TokenAnalytics, MODEL_PRICING
from app.core.llm_factory import get_llm_client

def run_lab_02():
    print("=" * 70)
    print("[LAB 02] TOKENS, CONTEXT WINDOWS, TEMPERATURE & COST ANALYSIS")
    print("=" * 70)

    sample_text = "Vector embeddings capture semantic relationships in high-dimensional vector spaces!"
    print(f"\n--- 1. Token Breakdown for Text ---")
    print(f"Sample Text: \"{sample_text}\"")

    breakdown = TokenAnalytics.tokenize_breakdown(sample_text)
    print(f"Character Count: {len(sample_text)}")
    print(f"Word Count:      {len(sample_text.split())}")
    print(f"Total Tokens:    {len(breakdown)}")
    print("\nVisual Token IDs and Fragments:")
    for t in breakdown[:12]:
        print(f"  Token ID {t['id']:<8} -> repr: {repr(t['text']):<20}")

    print("\n--- 2. Multi-Model Cost Calculator (for 100k input / 25k output tokens) ---")
    input_toks = 100_000
    output_toks = 25_000

    print(f"{'Model':<20} | {'Input Cost':<12} | {'Output Cost':<12} | {'Total Cost (USD)':<16} | {'Max Context':<12}")
    print("-" * 80)
    for model_name in MODEL_PRICING:
        cost = TokenAnalytics.estimate_cost(input_toks, output_toks, model_name)
        print(f"{model_name:<20} | ${cost['input_cost_usd']:<11.5f} | ${cost['output_cost_usd']:<11.5f} | ${cost['total_cost_usd']:<15.5f} | {cost['context_window_limit']:,} tok")

    print("\n--- 3. Temperature Parameter Dynamics ---")
    print("Temperature controls the sharpness of the probability distribution:")
    print("  T = 0.0 -> ArgMax / Greedy (Deterministic, ideal for code & RAG extraction)")
    print("  T = 0.7 -> Balanced (General chat & reasoning)")
    print("  T = 1.2 -> High Entropy (Creative writing, brainstorms)")

    client = get_llm_client()
    test_prompt = [{"role": "user", "content": "Explain what a vector embedding is in one sentence."}]

    for temp in [0.0, 0.7, 1.2]:
        res = client.generate(messages=test_prompt, temperature=temp)
        print(f"\n[Temp = {temp}] Latency: {res.latency_ms}ms")
        print(f"Content: {res.content.splitlines()[0] if res.content else ''}")

    print("\n[OK] Lab 02 completed successfully!")

if __name__ == "__main__":
    run_lab_02()
