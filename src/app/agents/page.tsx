import { HydrateClient } from "~/trpc/server";
import AgentBuilder from "../_components/AgentBuilder";
import Link from "next/link";

export default function AgentsPage() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-madkudu-gradient text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4 mb-8">
            <Link 
              href="/"
              className="text-blue-300 hover:text-blue-200 transition-colors"
            >
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-white font-medium">Agents</span>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem] mb-8">
            Agent Builder
          </h1>
          
          <p className="text-lg text-gray-200 mb-8">
            Create, edit, and manage agents that can be used in the chat interface.
          </p>
          
          <AgentBuilder />
        </div>
      </main>
    </HydrateClient>
  );
} 