import Link from "next/link";
import AgentForm from "~/app/_components/AgentForm";
import { HydrateClient } from "~/trpc/server";
import { serverApi } from "~/trpc/server";
import { Bot, Plus } from "lucide-react";

export default async function CreateAgentPage({ searchParams }: { searchParams: { from?: string }}) {
  let agentToClone;
  if (searchParams.from) {
    const originalAgent = await serverApi.agent.getById({ id: searchParams.from });
    if (originalAgent) {
      agentToClone = {
        ...originalAgent,
        name: `${originalAgent.name} (Copy)`,
        active: false, // Cloned agents are inactive by default
        allowedApis: JSON.parse(originalAgent.allowedApis) as string[]
      };
    }
  }

  return (
    <HydrateClient>
      <div className="container mx-auto px-4 flex flex-col h-full overflow-hidden">
        <div className="py-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/agents" className="hover:text-white transition-colors">Agent Builder</Link>
            <span>/</span>
            <span className="text-white">Create</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              {agentToClone ? <Bot className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                {agentToClone ? "Clone Agent" : "Create New Agent"}
              </h1>
              <p className="text-xs text-white/70">
                {agentToClone 
                  ? "Modify the details below to create your new agent" 
                  : "Configure a new agent to be used in the Playground"
                }
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AgentForm agent={agentToClone} />
        </div>
      </div>
    </HydrateClient>
  );
} 