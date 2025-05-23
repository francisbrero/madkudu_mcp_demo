import { HydrateClient } from "~/trpc/server";
import ChatInterface from "./_components/ChatInterface";

export default function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-madkudu-gradient text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem] text-center">
            MadKudu MCP Demo
          </h1>
          <ChatInterface />
        </div>
      </main>
    </HydrateClient>
  );
}
