import os
import io
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class Document(BaseModel):
    page_content: str
    metadata: Dict[str, Any]

class DocumentLoader:
    """Universal multi-format document loader supporting PDF, Markdown, TXT, and Web."""
    
    @staticmethod
    def load_from_text(text: str, source_name: str = "raw_text", extra_metadata: Optional[Dict[str, Any]] = None) -> List[Document]:
        meta = {"source": source_name, "file_type": "text", **(extra_metadata or {})}
        return [Document(page_content=text.strip(), metadata=meta)]

    @staticmethod
    def load_from_file_bytes(file_bytes: bytes, filename: str) -> List[Document]:
        ext = os.path.splitext(filename)[1].lower()
        if ext == ".pdf":
            return DocumentLoader.load_pdf(file_bytes, filename)
        elif ext in [".md", ".markdown"]:
            return DocumentLoader.load_markdown(file_bytes.decode("utf-8", errors="ignore"), filename)
        else:
            # Default text / docx fallback
            text = file_bytes.decode("utf-8", errors="ignore")
            return [Document(page_content=text, metadata={"source": filename, "file_type": ext or "text", "page": 1})]

    @staticmethod
    def load_pdf(pdf_bytes: bytes, filename: str) -> List[Document]:
        documents = []
        try:
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    documents.append(
                        Document(
                            page_content=text.strip(),
                            metadata={"source": filename, "file_type": "pdf", "page": idx + 1, "total_pages": len(reader.pages)}
                        )
                    )
        except Exception as e:
            # Fallback if pypdf fails
            documents.append(
                Document(
                    page_content=f"[PDF Parsing Notice: {str(e)}]",
                    metadata={"source": filename, "file_type": "pdf", "page": 1}
                )
            )
        return documents

    @staticmethod
    def load_markdown(md_text: str, filename: str) -> List[Document]:
        # Split markdown by top-level headers (# or ##) for section-aware document units
        sections = re.split(r'\n(?=#{1,3}\s+)', md_text)
        docs = []
        for idx, sec in enumerate(sections):
            if sec.strip():
                # Extract header if present
                first_line = sec.strip().split("\n")[0]
                header = first_line if first_line.startswith("#") else "General"
                docs.append(
                    Document(
                        page_content=sec.strip(),
                        metadata={"source": filename, "file_type": "markdown", "section": header, "section_idx": idx + 1}
                    )
                )
        return docs or [Document(page_content=md_text, metadata={"source": filename, "file_type": "markdown", "page": 1})]
