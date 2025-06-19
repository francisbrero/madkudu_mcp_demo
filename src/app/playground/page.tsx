'use client';

import { useState } from 'react';
import { useSettingsStore } from '~/stores/settings-store';
import { api } from '~/trpc/react';

type MCPTool = {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
};

type MCPToolArgs = Record<string, unknown>;

export default function PlaygroundPage() {
  const { mcpStatus } = useSettingsStore();
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolArgs, setToolArgs] = useState<string>('{}');
  const [result, setResult] = useState<string>('');

  const { data: tools } = api.mcp.getTools.useQuery(undefined, {
    enabled: mcpStatus === 'valid'
  });

  const runToolMutation = api.mcp.runTool.useMutation({
    onSuccess: (data) => {
      setResult(JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      setResult(`Error: ${error.message}`);
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
          } catch (error) {
            setResult('Error: Invalid JSON in arguments');
          }
        }}
        disabled={!selectedTool || runToolMutation.isPending}
        className="rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:bg-gray-400"
      >
        {runToolMutation.isPending ? 'Running...' : 'Run Tool'}
      </button>

      {result && (
        <div className="flex flex-col gap-2">
          <label className="font-medium">Result</label>
          <pre className="rounded border bg-gray-50 p-4 font-mono">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
} 