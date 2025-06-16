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

// Agent-specific prompt suggestions
const agentPrompts: Record<string, Array<{ text: string; description: string; emoji: string }>> = {
  "executive-outreach": [
    {
      text: "Draft personalized outreach to francis@madkudu.com",
      description: "AI email using real activity data & company context",
      emoji: "📧"
    },
    {
      text: "Write follow-up email to paul@madkudu.com about their recent demo",
      description: "Personalized follow-up based on engagement history", 
      emoji: "🔄"
    },
    {
      text: "Create executive pitch for CTO at stripe.com",
      description: "High-level value proposition for technical leaders",
      emoji: "🎯"
    }
  ],
  "account-plan": [
    {
      text: "Research madkudu.com account with live data",
      description: "Company profile, top users, recent activities & news",
      emoji: "🏢"
    },
    {
      text: "Create strategic account plan for gong.io",
      description: "Multi-touch campaign with prioritized actions",
      emoji: "📋"
    },
    {
      text: "Analyze growth opportunities at salesforce.com",
      description: "Expansion strategy based on usage patterns",
      emoji: "📈"
    }
  ],
  "agent3": [
    {
      text: "Show recent activities for stripe.com",
      description: "Live tracking data & user engagement insights",
      emoji: "📊"
    },
    {
      text: "Prepare QBR summary for madkudu.com account",
      description: "Usage analytics and performance metrics",
      emoji: "📈"
    },
    {
      text: "Analyze user engagement trends for francis@madkudu.com",
      description: "Individual activity patterns and growth signals",
      emoji: "🔍"
    }
  ]
};

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

  const handleSendMessage = (message: string) => {
    // A useEffect will trigger the submission.
    // This ensures that the `input` state is updated before `handleSubmit` is called.
    setInput(message);
  };

  const handleClearChat = () => {
    setLeftMessages([]);
    setRightMessages([]);
    setEnrichmentData({});
    setLeftLoading({ isLoading: false });
    setRightLoading({ isLoading: false });
  };

  useEffect(() => {
    // This effect runs when `input` changes, and triggers form submission.
    // It's used for both the initial prompt and subsequent messages.
    if (input && !leftLoading.isLoading && !rightLoading.isLoading) {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      handleSubmit(fakeEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

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
    } finally {
      setInput("");
    }
  };

  // Check if there's an ongoing conversation
  const hasMessages = leftMessages.length > 0 || rightMessages.length > 0;

  return (
    <div className="flex flex-col h-full bg-madkudu-gradient">
      {isLoadingAgents ? (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-white">Loading Agents...</p>
        </div>
      ) : (
        <>
          <header className="bg-transparent p-3 shadow-md z-10">
            {leftMessages.length === 0 && rightMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] max-w-4xl mx-auto px-4">
                <div className="w-full max-w-2xl">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-5 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-white font-medium text-sm">Agent:</span>
                      </div>
                      <AgentSelector
                        agents={agents}
                        selectedAgent={selectedAgent || agents[0]!}
                        onSelectAgent={handleAgentChange}
                        label=""
                      />
                    </div>
                    <ChatInput
                      onSendMessage={handleSendMessage}
                      isLoading={leftLoading.isLoading || rightLoading.isLoading}
                      isInitialPrompt={true}
                    />
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => handleSendMessage("Draft email for exec at Snyk.io")}
                        className="text-white/60 hover:text-white/80 transition-colors duration-200 text-sm"
                      >
                        Try: <span className="text-white/60 hover:text-white/80">"Draft email for exec at Snyk.io"</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <AgentSelector
                  agents={agents}
                  selectedAgent={selectedAgent || agents[0]!}
                  onSelectAgent={handleAgentChange}
                  label="Select Agent:"
                />
                <button
                  onClick={handleClearChat}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-xl border border-white/20 hover:bg-white/20 hover:text-white transition-all duration-200 text-sm font-medium"
                >
                  Clear Chat
                </button>
              </div>
            )}
          </header>
          <main className="flex-1 overflow-hidden p-4 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
            <div className="flex flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-3 flex-shrink-0 border-b border-white/10">
                <h2 className="text-base font-bold text-white">GPT-4o Only</h2>
                <p className="text-xs text-white/70 mt-0.5">Standard GPT without any enrichment</p>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <ChatPanel
                  messages={leftMessages}
                  loading={leftLoading}
                  className="p-0"
                />
              </div>
            </div>
            <div className="flex flex-col rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-3 flex-shrink-0 border-b border-white/10">
                <h2 className="text-base font-bold text-white">GPT-4o + MadKudu</h2>
                <p className="text-xs text-white/70 mt-0.5">Enhanced with MadKudu enrichment</p>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <ChatPanel
                  messages={rightMessages}
                  loading={rightLoading}
                  enrichmentData={enrichmentData}
                  showEnrichment={showEnrichmentData}
                  className="p-0"
                />
              </div>
            </div>
          </main>
          {hasMessages && (
            <footer className="p-3 bg-transparent">
              <div className="w-full max-w-4xl mx-auto">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  isLoading={leftLoading.isLoading || rightLoading.isLoading}
                />
              </div>
            </footer>
          )}
        </>
      )}
    </div>
  );
} 