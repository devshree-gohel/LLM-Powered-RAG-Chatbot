export interface TokenDetail {
  id: number;
  text: string;
  length: number;
}

export interface TokenizeResponse {
  text: string;
  token_count: number;
  tokens: TokenDetail[];
  cost_analysis: {
    model: string;
    input_tokens: number;
    total_tokens: number;
    input_cost_usd: number;
    total_cost_usd: number;
    context_window_limit: number;
    context_usage_percent: number;
  };
}

export interface ChunkItem {
  content: string;
  metadata: Record<string, any>;
  chunk_index: number;
  token_count: number;
}

export interface CompareChunkingResponse {
  text_length: number;
  total_tokens: number;
  strategies: {
    fixed_size: { chunks: ChunkItem[]; count: number };
    recursive_character: { chunks: ChunkItem[]; count: number };
    sliding_window: { chunks: ChunkItem[]; count: number };
    semantic_similarity: { chunks: ChunkItem[]; count: number };
  };
}

export interface SearchResultItem {
  content: string;
  metadata: Record<string, any>;
  score: number;
  chunk_id?: string;
  dense_rank?: number;
  sparse_rank?: number;
  rerank_score?: number;
  initial_score?: number;
}

export interface Citation {
  source_id: number;
  label: string;
  source: string;
  page?: number;
  section?: string;
  url?: string;
  domain?: string;
  source_type?: string;
  snippet: string;
  full_content: string;
  score: number;
}

export interface EvaluationData {
  faithfulness_score: number;
  answer_relevance_score: number;
  context_precision_score: number;
  overall_rag_score: number;
  latency_ms: number;
  details: {
    has_hallucination_risk: boolean;
    has_low_relevance: boolean;
    has_context_drift: boolean;
    citations_present: boolean;
  };
}

export interface RAGQueryResponse {
  query: string;
  answer: string;
  citations: Citation[];
  context_used: string;
  web_search_used?: boolean;
  evaluation: EvaluationData;
  llm_meta: {
    model: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    latency_ms: number;
  };
  total_latency_ms: number;
}
