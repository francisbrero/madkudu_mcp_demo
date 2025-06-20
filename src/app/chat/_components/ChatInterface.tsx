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
} from "openai/resources/chat";

export function ChatInterface() {
  const { openAIApiKey, madkuduApiKey, mcpStatus } = useSettingsStore();
  const [messages, setMessages] = useState<ChatCompletionMessageParam[]>([]);
  const [input, setInput] = useState("");
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
        messages: newMessages,
        openAIApiKey,
        madkuduApiKey,
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
        <div className="rounded-lg bg-yellow-100/80 p-6 text-center text-yellow-900 shadow-md ring-1 ring-yellow-200">
          <h3 className="font-semibold">Configuration Incomplete</h3>
          <p className="mt-2">
            Please ensure your MadKudu and OpenAI API keys are validated on the{" "}
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
    <div className="flex h-full flex-col bg-white">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-prose rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
            </div>
          </div>
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
        <div className="relative">
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
            placeholder="Type your message..."
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
} 