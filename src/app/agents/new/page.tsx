"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Bot, Sparkles } from "lucide-react";
import { api } from "~/trpc/react";

export default function NewAgentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");

  const createAgent = api.agent.create.useMutation({
    onSuccess: (data) => {
      // Redirect to the new agent's chat page
      router.push(`/agents/${data.id}`);
    },
    onError: (error) => {
      // Basic error handling
      alert(`Error creating agent: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && description && prompt) {
      createAgent.mutate({ name, description, prompt });
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/agents"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create New Agent</h1>
                <p className="text-muted-foreground">Define a specialized AI assistant</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Agents can be given specific tools and instructions to automate complex business tasks.
            </p>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto space-y-6 glass-card p-8 rounded-xl animate-slide-up"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium mb-2"
            >
              Agent Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., Sales Briefing Specialist"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full"
              placeholder="A short summary of what this agent does"
              required
            />
          </div>
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium mb-2"
            >
              Master Prompt
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Define the agent&apos;s persona, instructions, and which tools it can
              use by referencing them (e.g., `mcp_MadAPI_madkudu-account-details`).
            </p>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={15}
              className="input-field w-full font-mono text-sm"
              placeholder="You are a helpful assistant..."
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <Link href="/agents" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createAgent.isPending}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAgent.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {createAgent.isPending ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 