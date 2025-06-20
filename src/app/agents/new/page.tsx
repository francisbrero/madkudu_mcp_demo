"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center mb-6">
        <Link
          href="/agents"
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 mr-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Create New Agent</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto space-y-6 p-6 border rounded-lg shadow-sm"
      >
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Agent Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="e.g., Sales Briefing Specialist"
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="A short summary of what this agent does"
            required
          />
        </div>
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Master Prompt
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Define the agent's persona, instructions, and which tools it can
            use by referencing them (e.g., `mcp_MadAPI_madkudu-account-details`).
          </p>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={15}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-mono"
            placeholder="You are a helpful assistant..."
            required
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createAgent.isPending}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {createAgent.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {createAgent.isPending ? "Creating..." : "Create Agent"}
          </button>
        </div>
      </form>
    </div>
  );
} 