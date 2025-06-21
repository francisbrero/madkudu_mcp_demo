"use client";

import { useState, useEffect, useRef } from "react";
import { useSettingsStore } from "~/stores/settings-store";
import { api } from "~/trpc/react";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";
import Link from "next/link";
import type { ChatCompletionMessageParam } from "openai/resources/index.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type AgentChatInterfaceProps = {
  agentId: string;
};

export default function AgentChatInterface({ agentId }: AgentChatInterfaceProps) {
  const { openAIApiKey, madkuduApiKey, mcpStatus } = useSettingsStore();
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<"gpt-4o-mini" | "gpt-4o" | "o3-mini" | "o3">("gpt-4o-mini");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: getAgentChatResponse, isPending: isLoading } =
    api.agent.getAgentChatResponse.useMutation({
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
      // We don't send the system prompt to the backend
      const newMessages = messages.filter(msg => msg.role !== 'system');
      const updatedMessages = [...newMessages, userMessage];
      
      setMessages(updatedMessages);

      getAgentChatResponse({
        agentId,
        messages: updatedMessages.map(msg => ({
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
  
  if (mcpStatus !== "valid" || !openAIApiKey) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="rounded-lg bg-yellow-100/80 p-6 text-center text-yellow-900 shadow-md ring-1 ring-yellow-200">
          <h3 className="font-semibold">Configuration Incomplete</h3>
          <p className="mt-2">
            This agent requires valid API keys. Please go to the{" "}
            <Link href="/settings" className="font-medium text-yellow-950 underline hover:text-yellow-700">
              Settings page
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white flex-grow">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          msg.role !== 'system' && (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`prose dark:prose-invert max-w-none rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {typeof msg.content === 'string' ? msg.content : ''}
                </ReactMarkdown>
              </div>
            </div>
          )
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-prose rounded-lg bg-gray-200 px-4 py-2 text-gray-800">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-gray-500"></div>
                <div
                  className="h-2 w-2 animate-pulse rounded-full bg-gray-500"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="h-2 w-2 animate-pulse rounded-full bg-gray-500"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t bg-gray-50 p-4">
        <div className="flex items-center gap-4">
          <div>
            <select
              value={model}
              onChange={(e) =>
                setModel(
                  e.target.value as "gpt-4o-mini" | "gpt-4o" | "o3-mini" | "o3",
                )
              }
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
              className="w-full rounded-md border-gray-300 py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Chat with this agent..."
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 