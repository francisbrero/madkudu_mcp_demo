"use client";

import { useState, useEffect } from "react";
import ChatPanel from "./ChatPanel";
import ChatInput from "./ChatInput";
import AgentSelector from "./AgentSelector";
import { api } from "~/trpc/react";

export type Agent = {
  id: string;
  name: string;
  description: string;
};

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const agents: Agent[] = [
  {
    id: "executive-outreach",
    name: "Executive Outreach Writer",
    description: "Generate personalized executive outreach messages",
  },
  {
    id: "account-plan",
    name: "Account Plan Generator",
    description: "Generate a tactical account plan for a strategic sales target",
  },
  {
    id: "agent3",
    name: "Agent 3",
    description: "TBD",
  },
];

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [leftMessages, setLeftMessages] = useState<Message[]>([]);
  const [rightMessages, setRightMessages] = useState<Message[]>([]);
  const [leftAgent, setLeftAgent] = useState<Agent>(agents[0]);
  const [rightAgent, setRightAgent] = useState<Agent>(agents[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [enrichmentData, setEnrichmentData] = useState<Record<string, unknown>>({});
  const [showEnrichmentData, setShowEnrichmentData] = useState(true);

  const openaiMutation = api.openai.chat.useMutation();
  const madkuduMutation = api.madkudu.enhancedChat.useMutation();
  
  // Get the subscription client
  const streamChat = api.openai.streamChat.useSubscription;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message to both chat panels
    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setLeftMessages((prev) => [...prev, userMessage]);
    setRightMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingMessage(""); // Reset streaming message

    try {
      // Add placeholder message for streaming response
      const assistantPlaceholder: Message = {
        role: "assistant",
        content: "",
      };
      setLeftMessages((prev) => [...prev, assistantPlaceholder]);

      // Regular mutation for left panel (simpler approach for now)
      openaiMutation.mutate(
        {
          messages: [...leftMessages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          agentId: leftAgent.id,
        },
        {
          onSuccess: (data) => {
            setLeftMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: data.content,
              };
              return newMessages;
            });
          },
          onError: (err) => {
            console.error("Error with OpenAI API:", err);
            setLeftMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                role: "assistant",
                content: "Sorry, there was an error processing your request. Please try again later.",
              };
              return newMessages;
            });
          }
        }
      );

      // Call enhanced API with MadKudu enrichment (right panel)
      madkuduMutation.mutate(
        {
          messages: [...rightMessages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          agentId: rightAgent.id,
        },
        {
          onSuccess: (data) => {
            setRightMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: data.content,
              },
            ]);
            if (data.enrichmentData) {
              console.log("[MadKudu Enrichment Data]", data.enrichmentData);
              setEnrichmentData(data.enrichmentData);
            }
          },
          onError: (err) => {
            console.error("Error with MadKudu API:", err);
            setRightMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content:
                  "Sorry, there was an error processing your request with enrichment. Please try again later.",
              },
            ]);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }
      );
    } catch (err) {
      console.error("Error submitting:", err);
      setIsLoading(false);
    }

    setInput("");
  };

  // Update streaming content in the last message
  useEffect(() => {
    if (streamingMessage && leftMessages.length > 0) {
      setLeftMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: streamingMessage,
        };
        return newMessages;
      });
    }
  }, [streamingMessage]);

  return (
    <div className="flex w-full h-[calc(100vh-10rem)] gap-4 p-4">
      {/* Left Panel - GPT-4o only */}
      <div className="flex flex-col w-1/2 h-full border border-purple-700 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-purple-700 bg-purple-900">
          <AgentSelector
            agents={agents}
            selectedAgent={leftAgent}
            onSelectAgent={setLeftAgent}
            label="GPT-4o Only"
          />
        </div>
        <ChatPanel messages={leftMessages} />
      </div>

      {/* Right Panel - GPT-4o + MadKudu */}
      <div className="flex flex-col w-1/2 h-full border border-purple-700 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-purple-700 bg-purple-900 flex justify-between items-center">
          <AgentSelector
            agents={agents}
            selectedAgent={rightAgent}
            onSelectAgent={setRightAgent}
            label="GPT-4o + MadKudu API"
          />
          <div className="flex items-center">
            <label htmlFor="show-enrichment" className="mr-2 text-xs text-white">
              Show Enrichment
            </label>
            <input
              id="show-enrichment"
              type="checkbox"
              checked={showEnrichmentData}
              onChange={() => setShowEnrichmentData(!showEnrichmentData)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
          </div>
        </div>
        <ChatPanel 
          messages={rightMessages} 
          enrichmentData={enrichmentData} 
          showEnrichment={showEnrichmentData} 
        />
      </div>

      {/* Shared Input Bar */}
      <div className="fixed bottom-4 left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-7xl">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={isLoading}
        />
      </div>
    </div>
  );
} 