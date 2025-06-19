'use client';

import { useState } from 'react';
import { useSettingsStore } from '~/stores/settings-store';
import { api } from '~/trpc/react';

interface ToolProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

interface ToolSchema {
  properties: Record<string, ToolProperty>;
}

export function ToolPlayground() {
  const mcpStatus = useSettingsStore((state) => state.mcpStatus);
  const [selectedTool, setSelectedTool] = useState('');
  const [payload, setPayload] = useState('');
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch available tools
  const { data: toolsData, isLoading: isLoadingTools } = api.mcp.getTools.useQuery(
    undefined,
    {
      enabled: mcpStatus === 'valid',
    }
  );

  // Execute tool mutation
  const { mutate: executeTool, isLoading: isExecuting } = api.mcp.runTool.useMutation({
    onSuccess: (data) => {
      setResult(JSON.stringify(data.result, null, 2));
      setError('');
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setResult('');
    },
  });

  // Handle tool selection
  const handleToolSelect = (toolName: string) => {
    setSelectedTool(toolName);
    const tool = toolsData?.tools.find((t) => t.name === toolName);
    if (tool) {
      // Create a default payload based on the tool's schema
      const defaultPayload: Record<string, unknown> = {};
      Object.entries(tool.inputSchema.properties as Record<string, ToolProperty>).forEach(([key, value]) => {
        switch (value.type) {
          case 'string':
            defaultPayload[key] = '';
            break;
          case 'number':
            defaultPayload[key] = 0;
            break;
          case 'boolean':
            defaultPayload[key] = false;
            break;
          case 'array':
            defaultPayload[key] = [];
            break;
          case 'object':
            defaultPayload[key] = {};
            break;
        }
      });
      setPayload(JSON.stringify(defaultPayload, null, 2));
    }
  };

  // Handle execution
  const handleExecute = () => {
    try {
      const parsedPayload = JSON.parse(payload);
      executeTool({
        name: selectedTool,
        arguments: parsedPayload,
      });
    } catch (err) {
      setError('Invalid JSON payload');
    }
  };

  if (mcpStatus !== 'valid') {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-yellow-50 p-4 text-yellow-800">
          Please validate your MCP connection in the Settings page before using the playground.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label className="mb-2 block font-medium">Select Tool</label>
        <select
          className="w-full rounded-md border border-gray-300 p-2"
          value={selectedTool}
          onChange={(e) => handleToolSelect(e.target.value)}
          disabled={isLoadingTools ?? false}
        >
          <option value="">Select a tool...</option>
          {toolsData?.tools.map((tool) => (
            <option key={tool.name} value={tool.name}>
              {tool.name}
            </option>
          ))}
        </select>
      </div>

      {selectedTool && (
        <>
          <div>
            <label className="mb-2 block font-medium">Tool Description</label>
            <div className="rounded-md bg-gray-50 p-3">
              {toolsData?.tools.find((t) => t.name === selectedTool)?.description}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium">Payload (JSON)</label>
            <textarea
              className="h-48 w-full rounded-md border border-gray-300 font-mono p-2"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              placeholder="Enter JSON payload..."
            />
          </div>

          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
            onClick={handleExecute}
            disabled={isExecuting ?? false || !selectedTool || !payload}
          >
            {isExecuting ? 'Executing...' : 'Execute Tool'}
          </button>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              {error}
            </div>
          )}

          {result && (
            <div>
              <label className="mb-2 block font-medium">Result</label>
              <pre className="overflow-auto rounded-md bg-gray-50 p-3 font-mono">
                {result}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
} 