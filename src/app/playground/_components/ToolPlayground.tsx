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

// Infer the tool type from the tRPC query's output
type Tool = NonNullable<
  ReturnType<typeof api.mcp.getTools.useQuery>['data']
>[number];

/**
 * Generates a placeholder JSON object from a tool's input schema.
 */
function createParamsPlaceholder(tool: Tool | undefined): string {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (!tool?.inputSchema?.properties) {
    return '{}';
  }
  const placeholder: Record<string, unknown> = {};
  // The linter struggles with the complex type of `tool.inputSchema.properties`
  // which comes from the MCP SDK and JSONSchema. We know it's a record of objects
  // with a 'type' property, so we cast it to work with it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const [key, value] of Object.entries(tool.inputSchema.properties as any)) {
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
    // The linter struggles to infer the type of `t` here from the `tools` array
    // which is derived from a tRPC query. Explicitly casting to `any` for find.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const selectedTool = tools?.find((t: any) => t.name === toolName);
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
    } catch (e) {
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
        <div className="rounded-lg bg-yellow-100/80 p-6 text-center text-yellow-900 shadow-md ring-1 ring-yellow-200">
          <h3 className="font-semibold">Connection Not Validated</h3>
          <p className="mt-2">
            Please go to the{' '}
            <Link
              href="/settings"
              className="font-medium text-yellow-950 underline hover:text-yellow-700"
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
      <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800">
            MCP Tool Playground
          </h1>
          <p className="text-gray-600">
            Select a tool, provide the required parameters in JSON format, and
            execute it against the live MCP server.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label
              htmlFor="tool-select"
              className="block text-sm font-medium text-gray-700"
            >
              Select Tool
            </label>
            <select
              id="tool-select"
              value={selectedToolName}
              onChange={(e) => handleToolChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
              disabled={isLoadingTools || !tools}
            >
              <option value="" disabled>
                {isLoadingTools ? 'Loading tools...' : 'Select a tool to run'}
              </option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {tools?.map((tool: any) => (
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

          <div>
            <label
              htmlFor="params-textarea"
              className="block text-sm font-medium text-gray-700"
            >
              Parameters (JSON)
            </label>
            <textarea
              id="params-textarea"
              value={params}
              onChange={(e) => setParams(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {executeTool.isPending ? 'Executing...' : 'Execute Tool'}
          </button>
        </div>

        {error && !summarizeJson.isPending && (
          <div className="rounded-md bg-red-50 p-4">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <pre className="whitespace-pre-wrap break-all">{error}</pre>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {executeTool.isSuccess && result && (
            <div className="space-y-4 rounded-md bg-gray-50 p-4 ring-1 ring-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-800">Result</h3>
                {openaiStatus === 'valid' && (
                  <button
                    type="button"
                    onClick={handleSummarize}
                    disabled={summarizeJson.isPending}
                    className="inline-flex items-center rounded-md border border-transparent bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-teal-300"
                  >
                    {summarizeJson.isPending
                      ? 'Summarizing...'
                      : 'Summarize with AI'}
                  </button>
                )}
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono">
                  {result}
                </pre>
              </div>
            </div>
          )}

          <div>
            {summarizeJson.isPending && (
              <div className="flex h-full animate-pulse items-center justify-center rounded-md bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-700">
                  AI is summarizing...
                </p>
              </div>
            )}

            {summary && !summarizeJson.isPending && (
              <div className="relative h-full">
                <div className="prose prose-sm h-full max-w-none rounded-md border border-gray-200 bg-white p-4">
                  <button
                    onClick={handleCopy}
                    className="absolute right-2 top-2 rounded-md bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
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