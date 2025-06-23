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
import React from 'react';

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
  const properties = tool.inputSchema.properties;
  const required = tool.inputSchema.required || [];

  if (required.length > 0) {
    for (const key of required) {
      if (key in properties) {
        const prop = properties[key] as { type: string; default?: unknown; example?: unknown };
        if (prop.default !== undefined) {
          placeholder[key] = prop.default;
        } else if (prop.example !== undefined) {
          placeholder[key] = prop.example;
        } else {
          switch (prop.type) {
            case 'string':
              if (key === 'domain') {
                placeholder[key] = 'acme.com';
              } else if (key === 'email') {
                placeholder[key] = 'john@acme.com';
              } else {
                placeholder[key] = 'example';
              }
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
      }
    }
  } else if (Object.keys(properties).length > 0) {
    // If no required params, use the first optional one as a placeholder
    const firstKey = Object.keys(properties)[0];
    const prop = properties[firstKey] as { type: string; default?: unknown; example?: unknown };
    if (prop.default !== undefined) {
      placeholder[firstKey] = prop.default;
    } else if (prop.example !== undefined) {
      placeholder[firstKey] = prop.example;
    } else {
      switch (prop.type) {
        case 'string':
          if (firstKey === 'domain') {
            placeholder[firstKey] = 'acme.com';
          } else if (firstKey === 'email') {
            placeholder[firstKey] = 'john@acme.com';
          } else {
            placeholder[firstKey] = 'example';
          }
          break;
        case 'number':
          placeholder[firstKey] = 0;
          break;
        case 'boolean':
          placeholder[firstKey] = false;
          break;
        case 'array':
          placeholder[firstKey] = [];
          break;
        case 'object':
          placeholder[firstKey] = {};
          break;
        default:
          placeholder[firstKey] = null;
      }
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
      setSummary('');
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
            {selectedToolName && (
              (() => {
                const selectedTool = tools?.find((t) => t.name === selectedToolName) as Tool | undefined;
                if (!selectedTool) return null;
                const properties = selectedTool.inputSchema?.properties || {};
                const required = selectedTool.inputSchema?.required || [];
                const paramKeys = Object.keys(properties);
                // If no required fields but multiple optional fields, show a note
                const needsAtLeastOne = required.length === 0 && paramKeys.length > 1;
                return (
                  <div className="mb-4">
                    {selectedTool.description && (
                      <div className="mb-2 text-sm text-muted-foreground">
                        <strong>Description:</strong> {selectedTool.description}
                      </div>
                    )}
                    {needsAtLeastOne && (
                      <div className="mb-2 text-xs text-yellow-400">
                        <strong>Note:</strong> At least one of the following parameters is required.
                      </div>
                    )}
                    {selectedTool.inputSchema?.properties && (
                      <div className="mb-2">
                        <strong>Parameters:</strong>
                        <ul className="list-disc ml-6 mt-1">
                          {Object.entries(selectedTool.inputSchema.properties).map(([key, value]) => {
                            const prop = value as any;
                            const isRequired = selectedTool.inputSchema?.required?.includes(key);
                            return (
                              <li key={key} className="mb-1">
                                <span className="font-mono text-xs">{key}</span>
                                {': '}
                                <span className="text-xs">{prop.type}</span>
                                {isRequired ? (
                                  <span className="text-xs text-green-600 ml-1">(required)</span>
                                ) : (
                                  <span className="text-xs text-gray-400 ml-1">(optional)</span>
                                )}
                                {prop.description && (
                                  <span className="text-xs text-gray-400 ml-2">- {prop.description}</span>
                                )}
                                {prop.example && (
                                  <span className="text-xs text-blue-400 ml-2">e.g. {JSON.stringify(prop.example)}</span>
                                )}
                                {prop.default && (
                                  <span className="text-xs text-blue-400 ml-2">default: {JSON.stringify(prop.default)}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
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
              </div>
              <div className="mt-2 text-sm">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-muted-foreground">
                  {result}
                </pre>
              </div>
            </div>
          )}

          <div>
            {executeTool.isSuccess && result && openaiStatus === 'valid' && !summarizeJson.isPending && !summary && (
              <div className="flex justify-center mb-2" style={{ minHeight: '48px' }}>
                <button
                  type="button"
                  onClick={handleSummarize}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ minWidth: 160 }}
                >
                  Summarize with AI
                </button>
              </div>
            )}
            {summarizeJson.isPending && (
              <div className="glass-card rounded-xl p-6 animate-pulse-glow" style={{ minHeight: '300px', height: '100%' }}>
                <div className="text-sm font-medium text-primary mt-0 mb-2">
                  AI is summarizing...
                </div>
              </div>
            )}

            {summary && !summarizeJson.isPending && (
              <div className="relative h-full">
                <div className="glass-card prose prose-sm prose-invert h-full max-w-none rounded-xl p-6" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', overflowX: 'auto', minHeight: '300px', height: '100%' }}>
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: (props) => {
                        // Utility to flatten React children to string
                        function flattenChildren(children) {
                          if (typeof children === 'string') return children;
                          if (Array.isArray(children)) return children.map(flattenChildren).join('');
                          if (typeof children === 'object' && children && 'props' in children) return flattenChildren(children.props.children);
                          return '';
                        }
                        const linkText = flattenChildren(props.children).trim();
                        const href = props.href || '';
                        // Normalize for comparison: strip protocol, trim, lowercase
                        function normalizeUrl(url) {
                          return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
                        }
                        const showHref = normalizeUrl(linkText) !== normalizeUrl(href);
                        return (
                          <span style={{ wordBreak: 'break-all' }}>
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#60a5fa', textDecoration: 'underline' }}
                            >
                              {props.children}
                            </a>
                            {showHref && href && (
                              <span style={{ fontSize: '0.85em', color: '#aaa', marginLeft: 4 }}>
                                ({href})
                              </span>
                            )}
                          </span>
                        );
                      },
                      p: (props) => (
                        <p {...props} style={{ wordBreak: 'break-word', margin: 0 }} />
                      ),
                      li: (props) => (
                        <li {...props} style={{ wordBreak: 'break-word' }} />
                      ),
                      code: (props) => (
                        <code {...props} style={{ wordBreak: 'break-all', background: '#222', padding: '2px 4px', borderRadius: '4px' }} />
                      ),
                      pre: (props) => (
                        <pre {...props} style={{ overflowX: 'auto', background: '#222', padding: '8px', borderRadius: '6px' }} />
                      ),
                      h1: (props) => <h1 {...props} style={{ fontSize: '1.25em', fontWeight: 700, margin: '0.5em 0' }} />,
                      h2: (props) => <h2 {...props} style={{ fontSize: '1.1em', fontWeight: 600, margin: '0.5em 0' }} />,
                      h3: (props) => <h3 {...props} style={{ fontSize: '1em', fontWeight: 600, margin: '0.5em 0' }} />,
                    }}
                  >
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