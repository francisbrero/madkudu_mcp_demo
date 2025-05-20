"use client";

import { useEffect, useRef } from "react";
import { Message, LoadingState } from "./ChatInterface";
import ReactMarkdown from "react-markdown";
import EnrichmentDataDisplay from "./EnrichmentDataDisplay";
import StatusIndicator, { TypingIndicator } from "./StatusIndicator";

type ChatPanelProps = {
  messages: Message[];
  enrichmentData?: Record<string, unknown>;
  showEnrichment?: boolean;
  loadingState?: LoadingState;
};

export default function ChatPanel({ 
  messages, 
  enrichmentData = {}, 
  showEnrichment = false,
  loadingState = { isLoading: false }
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
    <div className="flex-1 overflow-y-auto p-4 bg-panel">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-400">
          <p>Start a conversation by typing a message below.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-[rgb(var(--color-primary))] text-white"
                    : "bg-[rgb(var(--color-surface))] border border-gray-700 text-white"
                }`}
              >
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          
          {/* Show typing indicator when streaming/loading */}
          {loadingState.isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <TypingIndicator />
          )}
          
          {/* Show enrichment data if available and enabled */}
          {showEnrichment && Object.keys(enrichmentData).length > 0 && (
            <div className="mt-4 mb-2">
              <EnrichmentDataDisplay enrichmentData={enrichmentData} />
            </div>
          )}
          
          {/* Loading progress indicator for the right panel */}
          {loadingState.isLoading && loadingState.step && (
            <StatusIndicator loadingState={loadingState} />
          )}
          
          <div ref={messageEndRef} />
        </div>
      )}
    </div>
  );
} 