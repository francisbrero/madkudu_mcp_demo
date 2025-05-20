import { HydrateClient } from "~/trpc/server";
import ChatInterface from "./_components/ChatInterface";

export default function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem] text-center mb-8">
            MadKudu MCP Demo
          </h1>
          <ChatInterface />
        </div>
      </main>
    </HydrateClient>
  );
}
