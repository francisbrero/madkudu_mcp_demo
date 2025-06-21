"use client";

import { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { api } from "~/trpc/react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";
import Link from "next/link";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from "openai/resources/index.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatInterface() {
  const { openAIApiKey, madkuduApiKey, mcpStatus } = useSettingsStore();
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<"gpt-4o-mini" | "gpt-4o" | "o3-mini" | "o3">("gpt-4o-mini");
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: getChatResponse, isPending: isLoading } =
    api.mcp.getChatResponse.useMutation<ChatCompletion | null>({
      onSuccess: (data) => {
        if (data) {
          setMessages((prev) => [...prev, data]);
        }
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `An error occurred: ${error.message}`,
          },
        ]);
      },
    });

  const handleSend = () => {
    if (input.trim() && madkuduApiKey && openAIApiKey) {
      const userMessage: ChatCompletionMessageParam = {
        role: "user",
        content: input,
      };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      getChatResponse({
        messages: newMessages.map(msg => ({
          role: msg.role as "user" | "assistant" | "system" | "tool",
          content: typeof msg.content === 'string' ? msg.content : '',
          ...('name' in msg && msg.name && { name: msg.name }),
          ...('tool_calls' in msg && msg.tool_calls && { tool_calls: msg.tool_calls }),
          ...('tool_call_id' in msg && msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
        })),
        openAIApiKey,
        madkuduApiKey,
        model,
      });
      setInput("");
    }
  };

  if (!isClient) {
    return null;
  }

  if (mcpStatus !== "valid" || !openAIApiKey) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="glass-card rounded-lg p-6 text-center">
          <h3 className="font-semibold text-yellow-500">Configuration Incomplete</h3>
          <p className="mt-2 text-muted-foreground">
            Please ensure your MadKudu and OpenAI API keys are validated on the{" "}
            <Link href="/settings" className="font-medium text-primary hover:underline">
              Settings page
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card flex h-full flex-col rounded-xl">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex animate-slide-up ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`prose prose-sm max-w-none rounded-lg px-4 py-3 ${
                msg.role === "user"
                  ? "bg-gradient-primary text-white prose-invert"
                  : "glass-card prose-invert"
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {typeof msg.content === 'string' ? msg.content : ''}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-card rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                <div
                  className="h-2 w-2 animate-pulse rounded-full bg-primary"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="h-2 w-2 animate-pulse rounded-full bg-primary"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-4">
          <div>
            <select
              value={model}
              onChange={(e) =>
                setModel(
                  e.target.value as "gpt-4o-mini" | "gpt-4o" | "o3-mini" | "o3",
                )
              }
              className="input-field min-w-[150px]"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="o3-mini">Claude 3.5 Sonnet</option>
              <option value="o3">Claude 3 Opus</option>
            </select>
          </div>
          <div className="relative flex-grow">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleSend();
                }
              }}
              className="input-field w-full"
              placeholder="Type your message..."
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 