"use client";

import { useEffect, useRef } from "react";
import type { Message, LoadingState } from "./ChatInterface";
import ReactMarkdown from "react-markdown";
import EnrichmentDataDisplay from "./EnrichmentDataDisplay";
import StatusIndicator, { TypingIndicator } from "./StatusIndicator";

type ChatPanelProps = {
  messages: Message[];
  enrichmentData?: Record<string, unknown>;
  showEnrichment?: boolean;
  loading?: LoadingState;
  className?: string;
};

export default function ChatPanel({ 
  messages, 
  enrichmentData = {}, 
  showEnrichment = false,
  loading,
  className = ""
}: ChatPanelProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Debug: Log when the ChatPanel renders with enrichment data
  useEffect(() => {
    console.log("[ChatPanel] Rendering with props:", { 
      messagesCount: messages.length,
      enrichmentDataKeys: Object.keys(enrichmentData),
      showEnrichment
    });
  }, [messages, enrichmentData, showEnrichment]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={`h-full overflow-y-auto overflow-x-hidden p-4 custom-scrollbar ${className}`}>
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-white/60">
          <p className="text-center text-base">Start a conversation by typing a message above.</p>
        </div>
      ) : (
        <div className="space-y-3 p-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-xl max-w-[85%] break-words overflow-hidden ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white ml-auto"
                  : "bg-white/10 backdrop-blur-sm border border-white/20 text-white"
              }`}
            >
              <div className="prose prose-invert max-w-none [&>*]:mb-3 [&>*:last-child]:mb-0 [&>p]:leading-relaxed [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>ul]:space-y-1 [&>ol]:space-y-1 [&>li]:leading-relaxed [&>pre]:whitespace-pre-wrap [&>pre]:break-words [&>code]:break-words">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 leading-relaxed text-sm break-words">{children}</p>,
                    h1: ({ children }) => <h1 className="text-lg font-semibold mb-2 mt-3 first:mt-0 break-words">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0 break-words">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-3 first:mt-0 break-words">{children}</h3>,
                    ul: ({ children }) => <ul className="space-y-1 ml-4 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-1 ml-4 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed text-sm break-words">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-white break-words">{children}</strong>,
                    em: ({ children }) => <em className="italic text-zinc-300 break-words">{children}</em>,
                    code: ({ children }) => <code className="bg-white/10 px-1 rounded text-xs break-words">{children}</code>,
                    pre: ({ children }) => <pre className="bg-white/10 p-3 rounded whitespace-pre-wrap break-words overflow-hidden">{children}</pre>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          
          {/* Show typing indicator when streaming/loading */}
          {loading?.isLoading && messages.length > 0 && 
           messages[messages.length - 1]?.role === "user" && 
           loading?.step?.includes("Generating") && (
            <TypingIndicator />
          )}
          
          {/* Show enrichment data if available and enabled */}
          {showEnrichment && Object.keys(enrichmentData).length > 0 && (
            <div className="mt-4 mb-2">
              <EnrichmentDataDisplay enrichmentData={enrichmentData} />
            </div>
          )}
          
          {/* Loading progress indicator for the right panel */}
          {loading?.isLoading && loading?.step && (
            <StatusIndicator loadingState={loading} />
          )}
          
          <div ref={messageEndRef} />
        </div>
      )}
    </div>
  );
} 