"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "~/trpc/react";
import AgentChatInterface from "./_components/AgentChatInterface";

type AgentPageProps = {
  params: {
    agentId: string;
  };
};

export default function AgentPage({ params }: AgentPageProps) {
  const {
    data: agent,
    isLoading,
    error,
  } = api.agent.getById.useQuery({ id: params.agentId });

  if (isLoading) {
    return <div>Loading agent...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading agent: {error.message}
        <Link href="/agents" className="block mt-4 text-blue-500">
          Back to Agents
        </Link>
      </div>
    );
  }

  if (!agent) {
    return (
      <div>
        Agent not found.
        <Link href="/agents" className="block mt-4 text-blue-500">
          Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <Link
          href="/agents"
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 mr-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">{agent.description}</p>
        </div>
      </div>
      <AgentChatInterface agentId={agent.id} />
    </div>
  );
} 