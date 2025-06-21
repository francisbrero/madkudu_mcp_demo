"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Plus, MessageSquare, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";

export default function AgentsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", description: "", prompt: "" });
  
  const { data: agents, refetch } = api.agent.list.useQuery();
  const createAgent = api.agent.create.useMutation();

  const handleCreateAgent = async () => {
    try {
      await createAgent.mutateAsync(newAgent);
      setNewAgent({ name: "", description: "", prompt: "" });
      setIsCreating(false);
      await refetch();
    } catch (error) {
      console.error("Failed to create agent:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Agents</h1>
        <p className="text-muted-foreground">Create and manage specialized AI agents for your business tasks</p>
      </div>

      <div className="mb-6">
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Agent
        </button>
      </div>

      {isCreating && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h2 className="text-xl font-semibold mb-4">Create New Agent</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className="input-field w-full"
                placeholder="e.g., Sales Email Writer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={newAgent.description}
                onChange={(e) => setNewAgent({ ...newAgent, description: e.target.value })}
                className="input-field w-full"
                placeholder="e.g., Writes personalized sales emails"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">System Prompt</label>
              <textarea
                value={newAgent.prompt}
                onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                className="input-field w-full h-48"
                placeholder="Enter the system prompt for this agent..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateAgent}
                disabled={!newAgent.name || !newAgent.description || !newAgent.prompt}
                className="btn-primary"
              >
                Create Agent
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewAgent({ name: "", description: "", prompt: "" });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {agents?.map((agent) => (
          <div key={agent.id} className="agent-card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                <p className="text-muted-foreground mb-4">{agent.description}</p>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/agents/${agent.id}`}
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat with Agent</span>
                  </Link>
                  <button className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
                    <Edit2 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button className="inline-flex items-center gap-2 text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {(!agents || agents.length === 0) && !isCreating && (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground mb-4">No agents created yet</p>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Agent
            </button>
          </div>
        )}
      </div>
    </div>
  );
}