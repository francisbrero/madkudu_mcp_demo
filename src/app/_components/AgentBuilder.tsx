"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";
import { Plus } from "lucide-react";
import AgentCard from "./AgentCard";
import { apiOptions } from "~/data/apiOptions";

type ApiOption = {
  id: string;
  name: string;
  description: string;
};

const inputTypes = [
  { id: "email", name: "Email Address" },
  { id: "domain", name: "Domain" },
  { id: "freeform", name: "Freeform" },
];

const outputFormats = [
  { id: "markdown", name: "Markdown" },
  { id: "json", name: "JSON" },
];

type Agent = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  allowedApis: string[];
  inputType: string;
  outputFormat: string;
  active: boolean;
};

export default function AgentBuilder() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const { data: agentsData, isLoading: isLoadingAgents, refetch } = api.agent.getAll.useQuery();
  const deleteMutation = api.agent.delete.useMutation({
    onSuccess: () => refetch()
  });
  
  useEffect(() => {
    if (agentsData) {
      setAgents(agentsData.map(agent => ({
        ...agent,
        allowedApis: JSON.parse(agent.allowedApis)
      })));
    }
  }, [agentsData]);
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end items-center mb-4 flex-shrink-0">
        <Link href="/agents/create" className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg font-medium text-sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingAgents ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-3">
              <div className="animate-spin h-5 w-5 text-blue-400">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-white/70 text-base">Loading agents...</p>
            </div>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/20">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No agents found</h3>
            <p className="text-base text-white/70 mb-4">
              Create your first AI agent to get started.
            </p>
            <Link 
              href="/agents/create" 
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg font-medium text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map(agent => (
              <AgentCard 
                key={agent.id}
                agent={agent}
                handleDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 