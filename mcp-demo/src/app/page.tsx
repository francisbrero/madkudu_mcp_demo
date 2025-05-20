import { HydrateClient } from "~/trpc/server";

export default function Home() {
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center px-4 py-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem] text-center">
            MadKudu MCP Demo — Choose an agent to get started
          </h1>
        </div>
      </main>
    </HydrateClient>
  );
}
