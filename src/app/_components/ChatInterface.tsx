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
  systemPrompt?: string;
  allowedApis?: string[];
  inputType?: string;
  outputFormat?: string;
  active?: boolean;
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

// Default agents as fallback - will be replaced by DB agents
const defaultAgents: Agent[] = [
  {
    id: "executive-outreach",
    name: "Executive Outreach Writer",
    description: "Generate personalized executive outreach messages based on company data",
    active: true,
  },
  {
    id: "account-plan",
    name: "Account Plan Generator",
    description: "Create a tactical account plan for strategic sales targets with prioritized actions",
    active: true,
  },
  {
    id: "agent3",
    name: "QBR Manager",
    description: "Prepare for a Quarterly Business Review with usage analytics and growth opportunities",
    active: true,
  },
];

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [leftMessages, setLeftMessages] = useState<Message[]>([]);
  const [rightMessages, setRightMessages] = useState<Message[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>(defaultAgents);
  const [leftLoading, setLeftLoading] = useState<LoadingState>({ isLoading: false });
  const [rightLoading, setRightLoading] = useState<LoadingState>({ isLoading: false });
  const [enrichmentData, setEnrichmentData] = useState<Record<string, unknown>>({});
  const showEnrichmentData = true;
  
  const openaiMutation = api.openai.chat.useMutation();
  const madkuduMutation = api.madkudu.enhancedChat.useMutation();
  
  // Fetch agents from the database
  const { data: agentsData, isLoading: isLoadingAgents } = api.agent.getActive.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (agentsData && agentsData.length > 0) {
      // Convert API strings to proper objects
      const formattedAgents = agentsData.map(agent => ({
        ...agent,
        allowedApis: JSON.parse(agent.allowedApis as string) as string[],
      }));
      setAgents(formattedAgents);
      
      // Set the first agent as selected if none selected yet
      if (!selectedAgent && formattedAgents.length > 0) {
        setSelectedAgent(formattedAgents[0] as Agent);
      }
    } else if (defaultAgents.length > 0 && !selectedAgent) {
      // Fallback to default agents if none from API
      setSelectedAgent(defaultAgents[0] as Agent);
    }
  }, [agentsData, selectedAgent]);
  
  // Handle agent change for both panels
  const handleAgentChange = (agent: Agent) => {
    setSelectedAgent(agent);
    setLeftMessages([]);
    setRightMessages([]);
    setEnrichmentData({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || leftLoading.isLoading || rightLoading.isLoading || !selectedAgent) return;
    
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

    try {
      // Setup for left panel (GPT-4o only)
      setLeftLoading({ isLoading: true, step: "Connecting to API..." });
      
      // Start with regular API call
      const messages = [...leftMessages, userMessage];
      
      setTimeout(() => {
        setLeftLoading({ isLoading: true, step: "Generating response..." });
        
        // Use regular mutation for left panel without simulated streaming
        openaiMutation.mutate(
          {
            messages: messages.map(({ role, content }) => ({
              role, 
              content,
            })),
            agentId: selectedAgent.id,
          },
          {
            onSuccess: (data) => {
              // Directly add the response to messages without streaming
              setLeftMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: data.content ?? "",
                },
              ]);
              setLeftLoading({ isLoading: false });
            },
            onError: (error: unknown) => {
              console.error("OpenAI error:", error);
              setLeftLoading({ isLoading: false });
              setLeftMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content: "Sorry, there was an error generating the response. Please try again.",
                },
              ]);
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
                agentId: selectedAgent.id,
              },
              {
                onSuccess: (data) => {
                  setRightMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: data.content ?? "",
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
                onError: (error: unknown) => {
                  console.error("Error with MadKudu API:", error instanceof Error ? error.message : String(error));
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
    } catch (error: unknown) {
      console.error("Error submitting:", error instanceof Error ? error.message : String(error));
      setLeftLoading({ isLoading: false });
      setRightLoading({ isLoading: false });
    }

    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Agent Selector moved to top */}
      <div className="mb-4">
        {isLoadingAgents ? (
          <div className="text-gray-400">Loading agents...</div>
        ) : selectedAgent ? (
          <AgentSelector
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={handleAgentChange}
            label="Select Agent"
          />
        ) : (
          <div className="text-gray-400">No agents available. Please create some in the Agent Builder.</div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow overflow-hidden">
        {/* Left Panel: GPT-4o Only */}
        <div className="flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h2 className="text-xl font-bold">GPT-4o Only</h2>
            <p className="text-sm text-gray-400">
              Standard GPT without any enrichment
            </p>
          </div>
          <ChatPanel
            messages={leftMessages}
            loading={leftLoading}
            className="flex-grow"
          />
        </div>

        {/* Right Panel: GPT-4o + MadKudu */}
        <div className="flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h2 className="text-xl font-bold">GPT-4o + MadKudu</h2>
            <p className="text-sm text-gray-400">
              Enhanced with MadKudu enrichment
            </p>
          </div>
          <div className="flex-grow flex flex-col overflow-hidden">
            <ChatPanel
              messages={rightMessages}
              loading={rightLoading}
              className="flex-grow"
            />
            {showEnrichmentData && Object.keys(enrichmentData).length > 0 && (
              <div className="p-4 bg-gray-800 border-t border-gray-700 overflow-y-auto max-h-[30vh]">
                <EnrichmentProgress enrichmentData={enrichmentData} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Input Bar */}
      <div className="mt-6">
        <ChatInput 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          isLoading={leftLoading.isLoading || rightLoading.isLoading}
          selectedAgent={selectedAgent}
        />
      </div>
    </div>
  );
} 