"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { api } from "~/trpc/react";

export default function AgentsPage() {
  const { data: agents, isLoading, error } = api.agent.list.useQuery();

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Agents</h1>
        <Link href="/agents/new">
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Agent
          </button>
        </Link>
      </div>

      {isLoading && <p>Loading agents...</p>}
      {error && <p className="text-red-500">Error: {error.message}</p>}

      {agents && agents.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No Agents Found</h2>
          <p className="text-muted-foreground mt-2">
            Get started by creating your first specialized agent.
          </p>
          <Link href="/agents/new">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4">
              Create Agent
            </button>
          </Link>
        </div>
      )}

      {agents && agents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`} className="block">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full hover:shadow-md transition-transform transform hover:-translate-y-1">
                <div className="p-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {agent.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 