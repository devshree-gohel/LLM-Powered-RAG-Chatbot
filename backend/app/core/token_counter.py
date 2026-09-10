import json
from typing import Dict, Any, List

# Pricing per million tokens (approximate standard pricing for educational & production budgeting)
MODEL_PRICING: Dict[str, Dict[str, float]] = {
    "gemini-1.5-flash": {"input": 0.075, "output": 0.30, "context_window": 1000000},
    "gemini-1.5-pro": {"input": 3.50, "output": 10.50, "context_window": 2000000},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60, "context_window": 128000},
    "gpt-4o": {"input": 2.50, "output": 10.00, "context_window": 128000},
    "claude-3-5-sonnet": {"input": 3.00, "output": 15.00, "context_window": 200000},
    "claude-3-haiku": {"input": 0.25, "output": 1.25, "context_window": 200000},
    "mock-educational-llm": {"input": 0.0, "output": 0.0, "context_window": 8192}
}

class TokenAnalytics:
    @staticmethod
    def count_tokens(text: str, model_name: str = "gpt-4o-mini") -> int:
        """Count tokens using tiktoken (fallback to character/word heuristic if tiktoken unavailable)."""
        if not text:
            return 0
        try:
            import tiktoken
            # Map standard models to appropriate cl100k_base or o200k_base
            if "gpt-4o" in model_name:
                encoding = tiktoken.get_encoding("o200k_base")
            else:
                encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except Exception:
            # Universal fallback heuristic: ~4 characters per token
            return max(1, int(len(text) / 3.8))

    @staticmethod
    def count_messages_tokens(messages: List[Dict[str, str]], model_name: str = "gpt-4o-mini") -> int:
        """Count tokens in a standard chat message payload including role overheads."""
        total = 0
        for msg in messages:
            total += 4  # Per message role & metadata overhead
            total += TokenAnalytics.count_tokens(msg.get("content", ""), model_name)
        total += 2  # Assistant reply primer
        return total

    @staticmethod
    def estimate_cost(input_tokens: int, output_tokens: int, model_name: str = "gemini-1.5-flash") -> Dict[str, Any]:
        """Calculate exact USD cost for input and output tokens."""
        pricing = MODEL_PRICING.get(model_name, MODEL_PRICING["gemini-1.5-flash"])
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        total_cost = input_cost + output_cost

        return {
            "model": model_name,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "input_cost_usd": round(input_cost, 7),
            "output_cost_usd": round(output_cost, 7),
            "total_cost_usd": round(total_cost, 7),
            "context_window_limit": pricing["context_window"],
            "context_usage_percent": round(((input_tokens + output_tokens) / pricing["context_window"]) * 100, 4)
        }

    @staticmethod
    def tokenize_breakdown(text: str) -> List[Dict[str, Any]]:
        """Deconstruct text into visual token pieces (Byte-Pair Encoding demonstration)."""
        if not text:
            return []
        try:
            import tiktoken
            encoding = tiktoken.get_encoding("cl100k_base")
            token_ids = encoding.encode(text)
            tokens = []
            for tid in token_ids:
                try:
                    token_str = encoding.decode([tid])
                except Exception:
                    token_str = str(tid)
                tokens.append({"id": tid, "text": token_str, "length": len(token_str)})
            return tokens
        except Exception:
            # Fallback simple word/punctuation splitter
            import re
            parts = re.findall(r"\w+|[^\w\s]|\s+", text)
            return [{"id": i, "text": p, "length": len(p)} for i, p in enumerate(parts)]
