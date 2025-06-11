import Link from "next/link";
import AgentForm from "~/app/_components/AgentForm";
import { HydrateClient, serverApi } from "~/trpc/server";
import { Bot, Edit } from "lucide-react";

export default async function EditAgentPage({ params }: { params: { id: string } }) {
  const agent = await serverApi.agent.getById({ id: params.id });

  if (!agent) {
    return (
      <div className="container mx-auto px-4 flex flex-col h-full overflow-hidden">
        <div className="py-6 flex-shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Agent not found</h1>
              <p className="text-sm text-white/70">
                The requested agent could not be found.
              </p>
            </div>
          </div>
          <Link href="/agents" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  // The `allowedApis` is a JSON string, so we need to parse it before passing to the form.
  const parsedAgent = {
      ...agent,
      allowedApis: JSON.parse(agent.allowedApis) as string[]
  }

  return (
    <HydrateClient>
      <div className="container mx-auto px-4 flex flex-col h-full overflow-hidden">
        <div className="py-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
            <Link href="/agents" className="hover:text-white transition-colors">Agent Builder</Link>
            <span>/</span>
            <span className="text-white">Edit</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Edit: {agent.name}
              </h1>
              <p className="text-sm text-white/70">
                Modify the agent's configuration below
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AgentForm agent={parsedAgent} />
        </div>
      </div>
    </HydrateClient>
  );
} 