import { HydrateClient } from "~/trpc/server";
import ApiTester from "../_components/ApiTester";

export default function McpTestPage() {
  return (
    <HydrateClient>
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <ApiTester />
        </div>
      </main>
    </HydrateClient>
  );
} 