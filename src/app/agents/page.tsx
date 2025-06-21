"use client";

import Link from "next/link";
import { PlusCircle, Users, Sparkles, Bot } from "lucide-react";
import { api } from "~/trpc/react";

export default function AgentsPage() {
  const { data: agents, isLoading, error } = api.agent.list.useQuery();

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="animate-fade-in mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Specialized Agents</h1>
                <p className="text-muted-foreground">Create AI agents for specific business tasks</p>
              </div>
            </div>
            <Link href="/agents/new" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create New Agent
            </Link>
          </div>
          <div className="glass-card p-4 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Each agent can be customized with specific prompts and tool access for focused automation.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-pulse-glow">
                <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
              </div>
              <p className="text-muted-foreground">Loading agents...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="glass-card p-6 rounded-xl border-red-500/20">
            <p className="text-red-400">Error: {error.message}</p>
          </div>
        )}

        {agents && agents.length === 0 && (
          <div className="glass-card text-center py-12 rounded-xl animate-fade-in">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Agents Found</h2>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first specialized agent.
            </p>
            <Link href="/agents/new" className="btn-secondary inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Your First Agent
            </Link>
          </div>
        )}

        {agents && agents.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent, index) => (
              <Link 
                key={agent.id} 
                href={`/agents/${agent.id}`} 
                className="group animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="agent-card h-full p-6 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gradient-primary">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {agent.id}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description || "No description provided"}
                  </p>
                  <div className="mt-4 flex items-center text-primary text-sm">
                    <span>Chat with agent</span>
                    <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 