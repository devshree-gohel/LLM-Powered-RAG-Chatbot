import re
from typing import List, Dict, Any, Tuple
from ..core.token_counter import TokenAnalytics

class ContextBuilder:
    """
    Constructs a structured, token-budgeted context string with standardized citation tags.
    Extracts citation references to power interactive grounding UI badges.
    """
    @staticmethod
    def build_context(
        retrieved_chunks: List[Dict[str, Any]],
        max_context_tokens: int = 2000
    ) -> Tuple[str, List[Dict[str, Any]]]:
        context_blocks = []
        cited_sources = []
        current_tokens = 0

        for idx, chunk in enumerate(retrieved_chunks, start=1):
            meta = chunk.get("metadata", {})
            source = meta.get("source", "Document")
            page = meta.get("page", None)
            section = meta.get("section", None)
            url = meta.get("url", None)
            domain = meta.get("domain", None)
            source_type = meta.get("source_type", "doc")
            title = meta.get("title", None)

            source_label = title if title else f"{source}"
            if page:
                source_label += f" (Page {page})"
            elif section:
                source_label += f" ({section})"
            elif domain:
                source_label += f" ({domain})"

            header = f"[Source #{idx}: {source_label}]"
            content = chunk.get("content", "").strip()
            block_text = f"{header}\n{content}\n"
            block_tokens = TokenAnalytics.count_tokens(block_text)

            if current_tokens + block_tokens > max_context_tokens:
                break

            context_blocks.append(block_text)
            current_tokens += block_tokens

            cited_sources.append({
                "source_id": idx,
                "label": source_label,
                "source": source,
                "page": page,
                "section": section,
                "url": url,
                "domain": domain,
                "source_type": source_type,
                "snippet": content[:200] + "..." if len(content) > 200 else content,
                "full_content": content,
                "score": chunk.get("rerank_score", chunk.get("score", 0.0))
            })

        formatted_context = "\n".join(context_blocks)
        return formatted_context, cited_sources

    @staticmethod
    def build_rag_prompt(query: str, formatted_context: str, system_instructions: str = "") -> List[Dict[str, str]]:
        system_prompt = (
            system_instructions or
            "You are Vera, an advanced, highly intelligent AI assistant specializing in factual knowledge retrieval, reasoning, and clear synthesis. "
            "When answering queries that ask for comparisons, differences, pros/cons, or 'vs' (e.g., 'difference between X and Y', 'compare A vs B'), "
            "ALWAYS include a well-structured Markdown comparison table. In the table header columns, ALWAYS use the EXACT REAL NAMES of the subjects being compared (e.g. `| Feature / Dimension | Python | JavaScript |` or `| Aspect | RAG | Fine-Tuning |`) — NEVER use generic placeholders like 'Approach A' or 'Option B'. "
            "Follow the table with key detailed explanations, trade-offs, and takeaways. "
            "When factual context or web search snippets are provided, synthesize a comprehensive, well-structured, fluent markdown answer with inline citations [Source #X]. "
            "Use clear headings, bullet points, and bold key terms for high readability."
        )

        user_content = (
            f"### REFERENCE CONTEXT & SOURCES:\n"
            f"{formatted_context if formatted_context else '[No specific documents attached]'}\n\n"
            f"### USER QUERY:\n"
            f"{query}\n\n"
            f"### INSTRUCTIONS:\n"
            f"Synthesize an accurate, detailed, well-formatted markdown response. If the query asks for a comparison or difference, provide a comprehensive Markdown comparison table using the EXACT names of the subjects in the header columns (not 'Approach A'/'Approach B'). Include inline citations [Source #X] where applicable."
        )

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]
