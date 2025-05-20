"use client";

import { useEffect, useRef } from "react";
import { Message } from "./ChatInterface";
import ReactMarkdown from "react-markdown";

type ChatPanelProps = {
  messages: Message[];
};

export default function ChatPanel({ messages }: ChatPanelProps) {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-purple-950">
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
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-white"
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
          <div ref={messageEndRef} />
        </div>
      )}
    </div>
  );
} 