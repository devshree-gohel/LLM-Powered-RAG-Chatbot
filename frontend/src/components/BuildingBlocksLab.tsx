import React, { useState } from 'react';
import { Cpu, DollarSign, Terminal, Code2, Wrench, Sparkles, Sliders, CheckCircle2, Zap } from 'lucide-react';
import { TokenizeResponse } from '../types';

export const BuildingBlocksLab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'tokens' | 'prompts' | 'json' | 'tools'>('tokens');

  // Tokenizer State
  const [tokenText, setTokenText] = useState('Embeddings convert semantic meaning into high-dimensional vectors for fast retrieval.');
  const [tokenizeResult, setTokenizeResult] = useState<TokenizeResponse | null>(null);
  const [isTokenizing, setIsTokenizing] = useState(false);

  // Prompt Lab State
  const [systemPrompt, setSystemPrompt] = useState('Explain like I am 10 years old with simple analogies.');
  const [userPrompt, setUserPrompt] = useState('How does Artificial Intelligence actually learn?');
  const [temperature, setTemperature] = useState(0.7);
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [provider, setProvider] = useState('gemini');
  const [promptResponse, setPromptResponse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // JSON Structured State
  const [jsonSchemaStr, setJsonSchemaStr] = useState(
    JSON.stringify(
      {
        type: 'object',
        properties: {
          concept: { type: 'string' },
          advantages: { type: 'array', items: { type: 'string' } },
          complexity_rating: { type: 'number' }
        },
        required: ['concept', 'advantages', 'complexity_rating']
      },
      null,
      2
    )
  );
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [isExtractingJson, setIsExtractingJson] = useState(false);

  // Tool Call State
  const [toolCallResult, setToolCallResult] = useState<any>(null);
  const [isCallingTool, setIsCallingTool] = useState(false);

  const handleTokenize = async () => {
    setIsTokenizing(true);
    try {
      const res = await fetch('/api/llm/tokenize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tokenText, model: modelName }),
      });
      const data = await res.json();
      setTokenizeResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTokenizing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          provider,
          model: modelName,
          temperature,
          max_tokens: 500
        }),
      });
      const data = await res.json();
      setPromptResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtractJson = async () => {
    setIsExtractingJson(true);
    try {
      const schema = JSON.parse(jsonSchemaStr);
      const res = await fetch('/api/llm/structured-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Extract key insights about Vector Indexing in Hybrid RAG pipelines.',
          schema_definition: schema,
          provider,
          model: modelName
        }),
      });
      const data = await res.json();
      setJsonResult(data);
    } catch (err) {
      alert('Invalid JSON Schema format');
    } finally {
      setIsExtractingJson(false);
    }
  };

  const handleSimulateTool = async () => {
    setIsCallingTool(true);
    try {
      const res = await fetch('/api/llm/tool-calling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'What is the current weather in Seattle and compute 256 * 4?',
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_current_weather',
                description: 'Get weather for a city',
                parameters: {
                  type: 'object',
                  properties: { location: { type: 'string' } },
                  required: ['location']
                }
              }
            }
          ],
          provider,
          model: modelName
        }),
      });
      const data = await res.json();
      setToolCallResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCallingTool(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Pill SubTabs */}
      <div className="flex border-b border-purple-500/20 gap-3 pb-3">
        {[
          { id: 'tokens', label: '1. Tokens & 3D Cost Engine', icon: Cpu },
          { id: 'prompts', label: '2. Prompt & Temperature Lab', icon: Sliders },
          { id: 'json', label: '3. Structured JSON Schemas', icon: Code2 },
          { id: 'tools', label: '4. Autonomous Tool Calling', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2.5 py-3 px-5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-amber-500 text-white shadow-[0_4px_16px_rgba(217,70,239,0.35)] translate-y-[-1px]'
                  : 'text-purple-300/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Tokens SubTab */}
      {activeSubTab === 'tokens' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-7 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl text-white">
                <Cpu className="w-5 h-5" />
              </span>
              Byte-Pair Encoding (BPE) Deconstruct
            </h3>
            <p className="text-sm text-purple-200/70 leading-relaxed">
              LLMs ingest text as token IDs generated by subword BPE tokenizers.
            </p>
            <textarea
              rows={4}
              value={tokenText}
              onChange={(e) => setTokenText(e.target.value)}
              className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-4 text-sm text-purple-100 focus:outline-none focus:border-fuchsia-400 font-mono shadow-inner leading-relaxed"
              placeholder="Enter text to tokenize..."
            />
            <button
              onClick={handleTokenize}
              disabled={isTokenizing}
              className="px-6 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl flex items-center gap-2 cursor-pointer uppercase tracking-wider"
            >
              {isTokenizing ? 'Processing...' : 'Deconstruct Tokens & Cost'}
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-7 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl text-white">
                <DollarSign className="w-5 h-5" />
              </span>
              Token Metrics & Pricing Breakdown
            </h3>

            {tokenizeResult ? (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#150e33] p-4 rounded-xl border border-purple-500/30 text-center shadow-md">
                    <div className="text-xs uppercase font-bold text-purple-300/70">Tokens</div>
                    <div className="text-3xl font-extrabold text-fuchsia-400 mt-1 font-mono">{tokenizeResult.token_count}</div>
                  </div>
                  <div className="bg-[#150e33] p-4 rounded-xl border border-purple-500/30 text-center shadow-md">
                    <div className="text-xs uppercase font-bold text-purple-300/70">USD Cost</div>
                    <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">${tokenizeResult.cost_analysis.input_cost_usd}</div>
                  </div>
                  <div className="bg-[#150e33] p-4 rounded-xl border border-purple-500/30 text-center shadow-md">
                    <div className="text-xs uppercase font-bold text-purple-300/70">Max Window</div>
                    <div className="text-3xl font-extrabold text-amber-400 mt-1 font-mono">{(tokenizeResult.cost_analysis.context_window_limit / 1000).toFixed(0)}k</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-purple-200 mb-2.5 block">
                    Interactive 3D Token Fragments:
                  </label>
                  <div className="flex flex-wrap gap-2 p-4 bg-[#0b071a] border border-purple-500/30 rounded-xl max-h-52 overflow-y-auto shadow-inner">
                    {tokenizeResult.tokens.map((t, idx) => (
                      <span
                        key={idx}
                        className={`text-sm px-3 py-1.5 rounded-lg font-mono border shadow-sm transition-transform hover:scale-105 cursor-default ${
                          idx % 4 === 0
                            ? 'bg-purple-950/80 border-purple-500/50 text-purple-200'
                            : idx % 4 === 1
                            ? 'bg-fuchsia-950/80 border-fuchsia-500/50 text-fuchsia-200'
                            : idx % 4 === 2
                            ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                            : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                        }`}
                        title={`Token ID: ${t.id}`}
                      >
                        {t.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-purple-300/50 text-sm italic">
                Click 'Deconstruct Tokens' to inspect token IDs and cost.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Prompts SubTab */}
      {activeSubTab === 'prompts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-7 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-xl text-white">
                <Sliders className="w-5 h-5" />
              </span>
              Prompt Engineering & Logit Softmax Temperature
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-purple-200/80 block mb-1.5">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-3 text-sm text-purple-100 font-medium"
                >
                  <option value="mock">Offline Simulator</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI GPT-4o</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-purple-200/80 block mb-1.5">Temperature ({temperature})</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-fuchsia-500 mt-2.5 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-purple-200/80 block mb-1.5">System Steering Instruction</label>
              <input
                type="text"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-3 text-sm text-purple-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-purple-200/80 block mb-1.5">User Query</label>
              <textarea
                rows={3}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-3 text-sm text-purple-100"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-6 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl cursor-pointer uppercase tracking-wider"
            >
              {isGenerating ? 'Generating...' : 'Run Generation Test'}
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-7 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white">
                <Terminal className="w-5 h-5" />
              </span>
              Raw Model Synthesis & Telemetry
            </h3>

            {promptResponse ? (
              <div className="space-y-4">
                <div className="bg-[#0b071a] border border-purple-500/30 rounded-xl p-5 font-mono text-sm text-purple-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {promptResponse.content}
                </div>
                <div className="flex gap-6 text-xs text-purple-200/80 border-t border-purple-500/20 pt-4 font-mono">
                  <span>Latency: <strong className="text-amber-400">{promptResponse.latency_ms}ms</strong></span>
                  <span>Input Tokens: <strong className="text-white">{promptResponse.input_tokens}</strong></span>
                  <span>Output Tokens: <strong className="text-white">{promptResponse.output_tokens}</strong></span>
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-purple-300/50 text-sm italic">
                Generate a response to see output and execution latency.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. JSON SubTab */}
      {activeSubTab === 'json' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel rounded-2xl p-7 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-xl text-white">
                <Code2 className="w-5 h-5" />
              </span>
              Target JSON Schema Definition
            </h3>
            <textarea
              rows={10}
              value={jsonSchemaStr}
              onChange={(e) => setJsonSchemaStr(e.target.value)}
              className="w-full bg-[#130d2d] border border-purple-500/30 rounded-xl p-4 text-xs md:text-sm font-mono text-emerald-300 shadow-inner"
            />
            <button
              onClick={handleExtractJson}
              disabled={isExtractingJson}
              className="px-6 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl cursor-pointer uppercase tracking-wider"
            >
              {isExtractingJson ? 'Enforcing Schema...' : 'Run Structured JSON Extraction'}
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-7 space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <span className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl text-white">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              Deterministic Parsed Output
            </h3>
            {jsonResult ? (
              <pre className="bg-[#0b071a] border border-purple-500/30 rounded-xl p-5 font-mono text-sm text-fuchsia-300 overflow-x-auto shadow-inner">
                {JSON.stringify(jsonResult.parsed_json, null, 2)}
              </pre>
            ) : (
              <div className="h-44 flex items-center justify-center text-purple-300/50 text-sm italic">
                Click Run to enforce strict schema-adherent JSON output.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Tools SubTab */}
      {activeSubTab === 'tools' && (
        <div className="glass-panel rounded-2xl p-7 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl text-white">
                  <Wrench className="w-5 h-5" />
                </span>
                Autonomous Tool Calling Dispatch
              </h3>
              <p className="text-sm text-purple-200/70 mt-1 leading-relaxed">
                Model inspects tools registry, identifies intent, emits function arguments, and executes local tools.
              </p>
            </div>
            <button
              onClick={handleSimulateTool}
              disabled={isCallingTool}
              className="px-6 py-3.5 btn-3d-primary text-white text-sm font-bold rounded-xl cursor-pointer uppercase tracking-wider"
            >
              {isCallingTool ? 'Evaluating Tool...' : 'Test Tool Dispatch'}
            </button>
          </div>

          {toolCallResult && (
            <div className="space-y-4 pt-4 border-t border-purple-500/20">
              <div className="bg-[#150e33] p-6 rounded-xl border border-purple-500/30 space-y-3 shadow-md">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Decision: {toolCallResult.finish_reason}
                </div>
                <div className="text-sm text-purple-100">{toolCallResult.content}</div>
                {toolCallResult.tool_calls && (
                  <div className="mt-3">
                    <div className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">Tool Invocations Emitted:</div>
                    <pre className="bg-[#0b071a] p-4 rounded-xl text-sm font-mono text-fuchsia-300 shadow-inner">
                      {JSON.stringify(toolCallResult.tool_calls, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
