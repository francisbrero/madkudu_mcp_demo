'use client';

import { useState } from 'react';
import { useSettingsStore } from '~/stores/settings-store';
import { api } from '~/trpc/react';

type MCPToolArgs = Record<string, unknown>;

type ResponseViewMode = 'raw' | 'parsed';

interface ResponseVisualizerProps {
  response: string;
  viewMode: ResponseViewMode;
  onViewModeChange: (mode: ResponseViewMode) => void;
}

function ResponseVisualizer({ response, viewMode, onViewModeChange }: ResponseVisualizerProps) {
  let displayContent = response;
  let parsedContent: unknown = null;
  let parseError: string | null = null;

  // Try to parse the JSON if we're in parsed mode
  if (viewMode === 'parsed' && response) {
    try {
      parsedContent = JSON.parse(response);
      displayContent = JSON.stringify(parsedContent, null, 2);
    } catch (err) {
      parseError = err instanceof Error ? err.message : 'Failed to parse JSON';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="font-medium">Result</label>
        <div className="flex items-center gap-2 rounded border p-1">
          <button
            onClick={() => onViewModeChange('raw')}
            className={`rounded px-2 py-1 text-sm ${
              viewMode === 'raw' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            Raw
          </button>
          <button
            onClick={() => onViewModeChange('parsed')}
            className={`rounded px-2 py-1 text-sm ${
              viewMode === 'parsed' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            Parsed
          </button>
        </div>
      </div>
      
      {parseError && viewMode === 'parsed' ? (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
          Failed to parse JSON: {parseError}
        </div>
      ) : (
        <pre className="max-h-[500px] overflow-auto rounded border bg-gray-50 p-4 font-mono">
          {displayContent}
        </pre>
      )}
    </div>
  );
}

export default function PlaygroundPage() {
  const { mcpStatus } = useSettingsStore();
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArgs, setToolArgs] = useState<string>('{}');
  const [result, setResult] = useState<string>('');
  const [viewMode, setViewMode] = useState<ResponseViewMode>('parsed');

  const { data: tools } = api.mcp.getTools.useQuery(undefined, {
    enabled: mcpStatus === 'valid'
  });

  const runToolMutation = api.mcp.runTool.useMutation({
    onSuccess: (data) => {
      // Store the raw JSON string
      setResult(JSON.stringify(data));
    },
    onError: (error) => {
      setResult(JSON.stringify({ error: error.message }));
    }
  });

  if (mcpStatus !== 'valid') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4">
        <h1 className="mb-4 text-2xl font-bold">MCP Not Connected</h1>
        <p>Please validate your API keys in the Settings page first.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Tool Playground</h1>
      
      <div className="flex flex-col gap-2">
        <label className="font-medium">Select Tool</label>
        <select 
          value={selectedTool}
          onChange={(e) => setSelectedTool(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">Select a tool...</option>
          {tools?.tools?.map((tool) => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium">Tool Arguments (JSON)</label>
        <textarea
          value={toolArgs}
          onChange={(e) => setToolArgs(e.target.value)}
          className="h-32 rounded border p-2 font-mono"
          placeholder="Enter tool arguments as JSON"
        />
      </div>

      <button
        onClick={() => {
          try {
            const args = JSON.parse(toolArgs) as MCPToolArgs;
            runToolMutation.mutate({
              name: selectedTool,
              arguments: args
            });
          } catch {
            setResult(JSON.stringify({ error: 'Invalid JSON in arguments' }));
          }
        }}
        disabled={!selectedTool || runToolMutation.isPending}
        className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-400"
      >
        {runToolMutation.isPending ? 'Running...' : 'Run Tool'}
      </button>

      {result && (
        <ResponseVisualizer
          response={result}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}
    </div>
  );
} 