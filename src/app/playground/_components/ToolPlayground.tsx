'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '~/stores/settings-store';
import { api } from '~/trpc/react';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { AppRouter } from '~/server/api/root';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ClipboardCopy, Check } from 'lucide-react';

// Define the tool type based on the expected structure
type Tool = {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
  annotations?: {
    title?: string;
  };
};

/**
 * Generates a placeholder JSON object from a tool's input schema.
 */
function createParamsPlaceholder(tool: Tool | undefined): string {
   
  if (!tool?.inputSchema?.properties) {
    return '{}';
  }
  const placeholder: Record<string, unknown> = {};
  // The linter struggles with the complex type of `tool.inputSchema.properties`
  // which comes from the MCP SDK and JSONSchema. We know it's a record of objects
  // with a 'type' property, so we cast it to work with it.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  for (const [key, value] of Object.entries(tool.inputSchema.properties)) {
    const prop = value as { type: string };
    switch (prop.type) {
      case 'string':
        placeholder[key] = '';
        break;
      case 'number':
        placeholder[key] = 0;
        break;
      case 'boolean':
        placeholder[key] = false;
        break;
      case 'array':
        placeholder[key] = [];
        break;
      case 'object':
        placeholder[key] = {};
        break;
      default:
        placeholder[key] = null;
    }
  }
  return JSON.stringify(placeholder, null, 2);
}

export function ToolPlayground() {
  const { mcpStatus, madkuduApiKey, openAIApiKey, openaiStatus } =
    useSettingsStore();
  const [selectedToolName, setSelectedToolName] = useState<string>('');
  const [params, setParams] = useState<string>('{}');
  const [result, setResult] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    data: tools,
    isLoading: isLoadingTools,
    error: toolsError,
  } = api.mcp.getTools.useQuery(
    { apiKey: madkuduApiKey },
    {
      enabled: mcpStatus === 'valid' && isClient && !!madkuduApiKey,
      refetchOnWindowFocus: false,
    },
  );

  const executeTool = api.mcp.runTool.useMutation({
    onSuccess: (data) => {
      setResult(JSON.stringify(data, null, 2));
      setError('');
      setSummary('');
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setError(error.message);
      setResult('');
      setSummary('');
    },
  });

  const summarizeJson = api.mcp.summarizeJson.useMutation({
    onSuccess: (data) => {
      setSummary(data.summary);
      setError('');
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      setError(error.message);
    },
  });

  const handleToolChange = (toolName: string) => {
    setSelectedToolName(toolName);
    const selectedTool = tools?.find((t) => t.name === toolName) as Tool | undefined;
    setParams(createParamsPlaceholder(selectedTool));
    setResult('');
    setError('');
    setSummary('');
  };

  const handleExecute = () => {
    try {
      const parsedParams = JSON.parse(params) as Record<string, unknown>;
      executeTool.mutate({
        apiKey: madkuduApiKey,
        toolId: selectedToolName,
        params: parsedParams,
      });
    } catch {
      setError('Invalid JSON in parameters.');
      setResult('');
      setSummary('');
    }
  };

  const handleSummarize = () => {
    if (!result || !openAIApiKey) return;
    summarizeJson.mutate({
      jsonContent: result,
      openAIApiKey: openAIApiKey,
    });
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      },
    );
  };

  if (!isClient) {
    return null; // Render nothing on the server
  }

  if (mcpStatus !== 'valid') {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="glass-card rounded-lg p-6 text-center">
          <h3 className="font-semibold text-yellow-500">Connection Not Validated</h3>
          <p className="mt-2 text-muted-foreground">
            Please go to the{' '}
            <Link
              href="/settings"
              className="font-medium text-primary hover:underline"
            >
              Settings page
            </Link>{' '}
            to validate your MadKudu API key.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="container mx-auto max-w-4xl space-y-6 animate-fade-in">

        <div className="grid grid-cols-1 gap-6">
          <div className="glass-card p-6 rounded-xl">
            <label
              htmlFor="tool-select"
              className="block text-sm font-medium mb-2"
            >
              Select Tool
            </label>
            <select
              id="tool-select"
              value={selectedToolName}
              onChange={(e) => handleToolChange(e.target.value)}
              className="input-field w-full"
              disabled={isLoadingTools || !tools}
            >
              <option value="" disabled>
                {isLoadingTools ? 'Loading tools...' : 'Select a tool to run'}
              </option>
              {tools?.map((tool) => (
                <option key={tool.name} value={tool.name}>
                  {tool.annotations?.title ?? tool.name}
                </option>
              ))}
            </select>
            {toolsError && (
              <p className="mt-2 text-sm text-red-600">
                Failed to load tools: {toolsError.message}
              </p>
            )}
          </div>

          <div className="glass-card p-6 rounded-xl">
            <label
              htmlFor="params-textarea"
              className="block text-sm font-medium mb-2"
            >
              Parameters (JSON)
            </label>
            <textarea
              id="params-textarea"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className="input-field w-full font-mono text-sm"
              rows={8}
              placeholder="Select a tool to see its parameters."
              disabled={!selectedToolName}
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleExecute}
            disabled={!selectedToolName || executeTool.isPending}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executeTool.isPending ? 'Executing...' : 'Execute Tool'}
          </button>
        </div>

        {error && !summarizeJson.isPending && (
          <div className="glass-card rounded-xl p-4 border-red-500/20">
            <h3 className="text-sm font-medium text-red-400">Error</h3>
            <div className="mt-2 text-sm text-red-300">
              <pre className="whitespace-pre-wrap break-all">{error}</pre>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {executeTool.isSuccess && result && (
            <div className="glass-card space-y-4 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Result</h3>
                {openaiStatus === 'valid' && (
                  <button
                    type="button"
                    onClick={handleSummarize}
                    disabled={summarizeJson.isPending}
                    className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {summarizeJson.isPending
                      ? 'Summarizing...'
                      : 'Summarize with AI'}
                  </button>
                )}
              </div>
              <div className="mt-2 text-sm">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-muted-foreground">
                  {result}
                </pre>
              </div>
            </div>
          )}

          <div>
            {summarizeJson.isPending && (
              <div className="glass-card rounded-xl p-6 animate-pulse-glow">
                <div className="text-sm font-medium text-primary mt-0 mb-2">
                  AI is summarizing...
                </div>
              </div>
            )}

            {summary && !summarizeJson.isPending && (
              <div className="relative h-full">
                <div className="glass-card prose prose-sm prose-invert h-full max-w-none rounded-xl p-6">
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 top-2 rounded-md bg-white/10 p-1.5 text-muted-foreground hover:bg-white/20 hover:text-foreground transition-colors"
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <ClipboardCopy size={16} />
                    )}
                  </button>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {summary}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 