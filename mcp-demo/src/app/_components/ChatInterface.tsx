"use client";

import { useState, useEffect, useRef } from "react";
import ChatPanel from "./ChatPanel";
import ChatInput from "./ChatInput";
import AgentSelector from "./AgentSelector";
import EnrichmentProgress from "./EnrichmentProgress";
import { api } from "~/trpc/react";

// Define a simple interface for our subscription
interface StreamSubscription {
  unsubscribe: () => void;
}

export type Agent = {
  id: string;
  name: string;
  description: string;
};

export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type LoadingState = {
  isLoading: boolean;
  step?: string;
};

export type StreamData = {
  delta?: string;
  done?: boolean;
};

const agents: Agent[] = [
  {
    id: "executive-outreach",
    name: "Executive Outreach Writer",
    description: "Generate personalized executive outreach messages based on company data",
  },
  {
    id: "account-plan",
    name: "Account Plan Generator",
    description: "Create a tactical account plan for strategic sales targets with prioritized actions",
  },
  {
    id: "agent3",
    name: "QBR Manager",
    description: "Prepare for a Quarterly Business Review with usage analytics and growth opportunities",
  },
];

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [leftMessages, setLeftMessages] = useState<Message[]>([]);
  const [rightMessages, setRightMessages] = useState<Message[]>([]);
  const [leftAgent, setLeftAgent] = useState<Agent>(agents[0]);
  const [rightAgent, setRightAgent] = useState<Agent>(agents[0]);
  const [leftLoading, setLeftLoading] = useState<LoadingState>({ isLoading: false });
  const [rightLoading, setRightLoading] = useState<LoadingState>({ isLoading: false });
  const [streamingMessage, setStreamingMessage] = useState("");
  const [enrichmentData, setEnrichmentData] = useState<Record<string, unknown>>({});
  const [showEnrichmentData, setShowEnrichmentData] = useState(true);
  
  const openaiMutation = api.openai.chat.useMutation();
  const madkuduMutation = api.madkudu.enhancedChat.useMutation();
  
  // Simulate streaming with character-by-character reveal
  const simulateStreaming = (finalText: string, callback: () => void) => {
    const textLength = finalText.length;
    let charIndex = 0;
    const intervalSpeed = 10; // milliseconds per character
    
    setStreamingMessage("");
    
    const streamingInterval = setInterval(() => {
      if (charIndex < textLength) {
        setStreamingMessage(finalText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(streamingInterval);
        callback();
      }
    }, intervalSpeed);
    
    return () => {
      clearInterval(streamingInterval);
    };
  };

  // Reset left chat history when agent changes
  const handleLeftAgentChange = (agent: Agent) => {
    setLeftAgent(agent);
    setLeftMessages([]);
  };

  // Reset right chat history when agent changes
  const handleRightAgentChange = (agent: Agent) => {
    setRightAgent(agent);
    setRightMessages([]);
    setEnrichmentData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || leftLoading.isLoading || rightLoading.isLoading) return;
    
    // Add user message to both chat panels
    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setLeftMessages((prev) => [...prev, userMessage]);
    setRightMessages((prev) => [...prev, userMessage]);
    
    // Set loading states
    setLeftLoading({ isLoading: true, step: "Initializing chat..." });
    setRightLoading({ isLoading: true, step: "Preparing request..." });
    
    // Reset streaming message
    setStreamingMessage("");

    try {
      // Add placeholder message for streaming response
      const assistantPlaceholder: Message = {
        role: "assistant",
        content: "",
      };
      setLeftMessages((prev) => [...prev, assistantPlaceholder]);

      // Setup for left panel (GPT-4o only)
      setLeftLoading({ isLoading: true, step: "Connecting to API..." });
      
      // Start with regular API call
      const messages = [...leftMessages, userMessage];
      
      setTimeout(() => {
        setLeftLoading({ isLoading: true, step: "Generating response..." });
        
        // Use regular mutation for left panel with simulated streaming
        openaiMutation.mutate(
          {
            messages: messages.map(({ role, content }) => ({
              role, 
              content,
            })),
            agentId: leftAgent.id,
          },
          {
            onSuccess: (data) => {
              // Simulate streaming of the response
              const cleanupStreaming = simulateStreaming(data.content, () => {
                setLeftLoading({ isLoading: false });
              });
              
              // Cleanup function if component unmounts during streaming
              return () => cleanupStreaming();
            },
            onError: (err) => {
              console.error("OpenAI error:", err);
              setLeftLoading({ isLoading: false });
              setLeftMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: "Sorry, there was an error generating the response. Please try again.",
                };
                return newMessages;
              });
            }
          }
        );
      }, 500);

      // Call enhanced API with MadKudu enrichment (right panel) with progress updates
      setRightLoading({ isLoading: true, step: "Extracting context from message..." });
      
      setTimeout(() => {
        setRightLoading({ isLoading: true, step: "Identifying entities..." });
        
        setTimeout(() => {
          setRightLoading({ isLoading: true, step: "Retrieving enrichment data..." });
          
          setTimeout(() => {
            setRightLoading({ isLoading: true, step: "Generating enhanced response..." });
            
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
                    // Debug: Log each key and value in enrichmentData
                    console.log("[MadKudu Enrichment Data Keys]", Object.keys(data.enrichmentData));
                    Object.entries(data.enrichmentData).forEach(([key, value]) => {
                      console.log(`[MadKudu Enrichment] ${key}:`, value);
                    });
                    
                    // Create a structured format for display instead of the raw data
                    const formattedData: Record<string, unknown> = {};
                    
                    // Format Contact Context
                    if (data.enrichmentData.contactContext) {
                      formattedData["Contact Context"] = data.enrichmentData.contactContext;
                    }
                    
                    // Format Company Context
                    if (data.enrichmentData.companyContext) {
                      formattedData["Company Context"] = data.enrichmentData.companyContext;
                    }
                    
                    // Format Company Name
                    if (data.enrichmentData.companyName) {
                      formattedData["Company Name"] = data.enrichmentData.companyName;
                    }
                    
                    // Format Research Context
                    if (data.enrichmentData.researchContext) {
                      const researchText = data.enrichmentData.researchContext as string;
                      console.log(`[MadKudu Enrichment] Research Context (length: ${researchText.length}): ${researchText.substring(0, 100)}...`);
                      
                      // Check if we got an empty string or 'No research data found'
                      if (!researchText.trim() || researchText === 'No research data found') {
                        console.log(`[MadKudu Enrichment] Empty or default research context data received`);
                      }
                      
                      formattedData["Research Context"] = researchText;
                    } else {
                      console.log(`[MadKudu Enrichment] No research context available`);
                    }
                    
                    console.log("[MadKudu Enrichment] Formatted data:", formattedData);
                    setEnrichmentData(formattedData);
                    // Debug: Log the state after setting
                    setTimeout(() => console.log("[MadKudu Enrichment] State after setting:", enrichmentData), 100);
                  }
                  setRightLoading({ isLoading: false });
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
                  setRightLoading({ isLoading: false });
                },
              }
            );
          }, 1000);
        }, 1000);
      }, 1000);
    } catch (err) {
      console.error("Error submitting:", err);
      setLeftLoading({ isLoading: false });
      setRightLoading({ isLoading: false });
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
            onSelectAgent={handleLeftAgentChange}
            label="GPT-4o Only (Streaming)"
          />
        </div>
        <div className="bg-purple-900/50 px-3 py-1.5 border-b border-purple-700 text-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${leftLoading.isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span>Active Agent: <span className="font-semibold">{leftAgent.name}</span></span>
          </div>
          {leftLoading.isLoading && (
            <div className="text-xs font-medium text-yellow-300">{leftLoading.step}</div>
          )}
        </div>
        <ChatPanel messages={leftMessages} loadingState={leftLoading} />
      </div>

      {/* Right Panel - GPT-4o + MadKudu */}
      <div className="flex flex-col w-1/2 h-full border border-purple-700 rounded-lg overflow-hidden">
        <div className="p-2 border-b border-purple-700 bg-purple-900 flex justify-between items-center">
          <AgentSelector
            agents={agents}
            selectedAgent={rightAgent}
            onSelectAgent={handleRightAgentChange}
            label="GPT-4o + MadKudu API"
          />
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label htmlFor="show-enrichment" className="mr-2 text-xs text-white">
                Show Enrichment
              </label>
              <input
                id="show-enrichment"
                type="checkbox"
                checked={showEnrichmentData}
                onChange={() => {
                  console.log("[Show Enrichment] Toggling from", showEnrichmentData, "to", !showEnrichmentData);
                  setShowEnrichmentData(!showEnrichmentData);
                }}
                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        <div className="bg-purple-900/50 px-3 py-1.5 border-b border-purple-700 text-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${rightLoading.isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span>Active Agent: <span className="font-semibold">{rightAgent.name}</span></span>
          </div>
          {rightLoading.isLoading && (
            <div className="text-xs font-medium text-yellow-300">{rightLoading.step}</div>
          )}
        </div>
        {rightLoading.isLoading && (
          <div className="px-4 pt-3">
            <EnrichmentProgress loadingState={rightLoading} />
          </div>
        )}
        <ChatPanel 
          messages={rightMessages} 
          enrichmentData={enrichmentData} 
          showEnrichment={showEnrichmentData}
          loadingState={rightLoading}
        />
      </div>

      {/* Shared Input Bar */}
      <div className="fixed bottom-4 left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-7xl">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          disabled={leftLoading.isLoading || rightLoading.isLoading}
        />
      </div>
    </div>
  );
} 