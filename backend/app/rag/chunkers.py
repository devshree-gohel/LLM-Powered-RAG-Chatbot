import re
from typing import List, Dict, Any, Optional
from .loaders import Document
from ..core.token_counter import TokenAnalytics

class Chunk(BaseModel := type('BaseModel', (), {})):
    def __init__(self, content: str, metadata: Dict[str, Any], chunk_index: int, token_count: int):
        self.content = content
        self.metadata = metadata
        self.chunk_index = chunk_index
        self.token_count = token_count

    def to_dict(self) -> Dict[str, Any]:
        return {
            "content": self.content,
            "metadata": self.metadata,
            "chunk_index": self.chunk_index,
            "token_count": self.token_count
        }

class BaseChunker:
    def chunk(self, documents: List[Document]) -> List[Dict[str, Any]]:
        raise NotImplementedError

class FixedSizeChunker(BaseChunker):
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk(self, documents: List[Document]) -> List[Dict[str, Any]]:
        chunks = []
        global_idx = 0
        step = max(1, self.chunk_size - self.chunk_overlap)

        for doc in documents:
            text = doc.page_content
            for i in range(0, len(text), step):
                chunk_text = text[i:i + self.chunk_size].strip()
                if chunk_text:
                    meta = {**doc.metadata, "chunk_strategy": "fixed_size", "start_char": i, "end_char": i + len(chunk_text)}
                    tokens = TokenAnalytics.count_tokens(chunk_text)
                    chunks.append(Chunk(chunk_text, meta, global_idx, tokens).to_dict())
                    global_idx += 1
        return chunks

class RecursiveCharacterChunker(BaseChunker):
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100, separators: Optional[List[str]] = None):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", "; ", ", ", " ", ""]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        final_chunks = []
        separator = separators[-1]
        for s in separators:
            if s == "":
                separator = s
                break
            if s in text:
                separator = s
                break

        splits = text.split(separator) if separator != "" else list(text)
        good_splits = []
        for s in splits:
            if s.strip():
                good_splits.append(s.strip())

        merged_text = ""
        for piece in good_splits:
            candidate = f"{merged_text}{separator}{piece}" if merged_text else piece
            if len(candidate) <= self.chunk_size:
                merged_text = candidate
            else:
                if merged_text:
                    final_chunks.append(merged_text)
                # If a single piece is larger than chunk_size, recurse with finer separators
                if len(piece) > self.chunk_size and len(separators) > 1:
                    next_separators = separators[separators.index(separator) + 1:]
                    sub_chunks = self._split_text(piece, next_separators)
                    final_chunks.extend(sub_chunks)
                    merged_text = ""
                else:
                    merged_text = piece

        if merged_text:
            final_chunks.append(merged_text)

        return final_chunks

    def chunk(self, documents: List[Document]) -> List[Dict[str, Any]]:
        chunks = []
        global_idx = 0
        for doc in documents:
            raw_pieces = self._split_text(doc.page_content, self.separators)
            for piece in raw_pieces:
                if piece.strip():
                    meta = {**doc.metadata, "chunk_strategy": "recursive_character"}
                    tokens = TokenAnalytics.count_tokens(piece)
                    chunks.append(Chunk(piece, meta, global_idx, tokens).to_dict())
                    global_idx += 1
        return chunks

class SlidingWindowChunker(BaseChunker):
    def __init__(self, window_size_sentences: int = 4, step_size_sentences: int = 2):
        self.window_size = window_size_sentences
        self.step_size = max(1, step_size_sentences)

    def chunk(self, documents: List[Document]) -> List[Dict[str, Any]]:
        chunks = []
        global_idx = 0
        for doc in documents:
            # Sentence split
            sentences = re.split(r'(?<=[.!?])\s+', doc.page_content)
            sentences = [s.strip() for s in sentences if s.strip()]
            for i in range(0, len(sentences), self.step_size):
                window = sentences[i:i + self.window_size]
                chunk_text = " ".join(window)
                if chunk_text:
                    meta = {**doc.metadata, "chunk_strategy": "sliding_window", "sentence_range": f"{i}-{i+len(window)}"}
                    tokens = TokenAnalytics.count_tokens(chunk_text)
                    chunks.append(Chunk(chunk_text, meta, global_idx, tokens).to_dict())
                    global_idx += 1
                    if i + self.window_size >= len(sentences):
                        break
        return chunks

class SemanticSimilarityChunker(BaseChunker):
    """Chunks text based on semantic shifts between adjacent sentences."""
    def __init__(self, max_tokens: int = 350, similarity_threshold: float = 0.65):
        self.max_tokens = max_tokens
        self.similarity_threshold = similarity_threshold

    def chunk(self, documents: List[Document]) -> List[Dict[str, Any]]:
        chunks = []
        global_idx = 0
        for doc in documents:
            sentences = re.split(r'(?<=[.!?])\s+', doc.page_content)
            sentences = [s.strip() for s in sentences if s.strip()]
            if not sentences:
                continue

            current_group = [sentences[0]]
            for i in range(1, len(sentences)):
                next_sent = sentences[i]
                current_text = " ".join(current_group)
                candidate = f"{current_text} {next_sent}"

                # Split if candidate exceeds token limit or starts a distinct topic (heuristic transition word)
                starts_new_topic = bool(re.match(r'^(However|Furthermore|In contrast|Additionally|Next|Finally|Consequently|Section|Chapter)', next_sent, re.IGNORECASE))
                tokens = TokenAnalytics.count_tokens(candidate)

                if tokens > self.max_tokens or (starts_new_topic and len(current_group) >= 2):
                    chunk_text = " ".join(current_group)
                    meta = {**doc.metadata, "chunk_strategy": "semantic_similarity"}
                    chunks.append(Chunk(chunk_text, meta, global_idx, TokenAnalytics.count_tokens(chunk_text)).to_dict())
                    global_idx += 1
                    current_group = [next_sent]
                else:
                    current_group.append(next_sent)

            if current_group:
                chunk_text = " ".join(current_group)
                meta = {**doc.metadata, "chunk_strategy": "semantic_similarity"}
                chunks.append(Chunk(chunk_text, meta, global_idx, TokenAnalytics.count_tokens(chunk_text)).to_dict())
                global_idx += 1

        return chunks

def get_chunker(strategy: str = "recursive", **kwargs) -> BaseChunker:
    strat = strategy.lower()
    if "fixed" in strat:
        return FixedSizeChunker(
            chunk_size=kwargs.get("chunk_size", 500),
            chunk_overlap=kwargs.get("chunk_overlap", 100)
        )
    elif "sliding" in strat:
        return SlidingWindowChunker(
            window_size_sentences=kwargs.get("window_size_sentences", 4),
            step_size_sentences=kwargs.get("step_size_sentences", 2)
        )
    elif "semantic" in strat:
        return SemanticSimilarityChunker(
            max_tokens=kwargs.get("max_tokens", 350)
        )
    else:
        return RecursiveCharacterChunker(
            chunk_size=kwargs.get("chunk_size", 500),
            chunk_overlap=kwargs.get("chunk_overlap", 100)
        )
