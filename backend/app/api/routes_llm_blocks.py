import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ..core.token_counter import TokenAnalytics
from ..core.llm_factory import get_llm_client, LLMResponse

router = APIRouter(prefix="/llm", tags=["LLM Building Blocks"])

class TokenizeRequest(BaseModel):
    text: str
    model: str = "gemini-1.5-flash"

class GenerateRequest(BaseModel):
    messages: List[Dict[str, str]]
    provider: str = "mock"
    model: str = "gemini-1.5-flash"
    temperature: float = 0.7
    max_tokens: int = 1000

class StructuredOutputRequest(BaseModel):
    prompt: str
    schema_definition: Dict[str, Any]
    provider: str = "mock"
    model: str = "gemini-1.5-flash"

class ToolCallRequest(BaseModel):
    prompt: str
    tools: List[Dict[str, Any]]
    provider: str = "mock"
    model: str = "gemini-1.5-flash"

@router.post("/tokenize")
def tokenize_text(req: TokenizeRequest):
    """Visual BPE token breakdown and cost estimation."""
    tokens = TokenAnalytics.tokenize_breakdown(req.text)
    count = TokenAnalytics.count_tokens(req.text, req.model)
    cost = TokenAnalytics.estimate_cost(count, 0, req.model)
    return {
        "text": req.text,
        "token_count": count,
        "tokens": tokens,
        "cost_analysis": cost
    }

@router.post("/generate", response_model=LLMResponse)
def generate_response(req: GenerateRequest):
    """Generate LLM response with custom temperature, model, and system/user messages."""
    client = get_llm_client(req.provider)
    return client.generate(
        messages=req.messages,
        model=req.model,
        temperature=req.temperature,
        max_tokens=req.max_tokens
    )

@router.post("/structured-output")
def generate_structured_output(req: StructuredOutputRequest):
    """Enforce structured JSON output format."""
    client = get_llm_client(req.provider)
    messages = [
        {"role": "system", "content": f"You are a strict data extraction system. Return ONLY valid JSON adhering to schema: {json.dumps(req.schema_definition)}"},
        {"role": "user", "content": req.prompt}
    ]
    res = client.generate(
        messages=messages,
        model=req.model,
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    return {
        "raw_response": res.content,
        "parsed_json": json.loads(res.content) if res.content.startswith("{") or res.content.startswith("[") else {"text": res.content},
        "metadata": res.model_dump()
    }

@router.post("/tool-calling")
def simulate_tool_calling(req: ToolCallRequest):
    """Simulate tool/function calling registration and dispatch."""
    client = get_llm_client(req.provider)
    messages = [
        {"role": "system", "content": "You have access to the provided tools. If necessary, invoke a tool."},
        {"role": "user", "content": req.prompt}
    ]
    res = client.generate(
        messages=messages,
        model=req.model,
        tools=req.tools
    )
    return {
        "finish_reason": res.finish_reason,
        "tool_calls": res.tool_calls,
        "content": res.content,
        "metadata": res.model_dump()
    }

@router.post("/stream")
async def stream_response(req: GenerateRequest):
    """Stream token responses via Server-Sent Events (SSE)."""
    client = get_llm_client(req.provider)
    async def event_generator():
        async for chunk in client.generate_stream(req.messages, req.model, req.temperature, req.max_tokens):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
