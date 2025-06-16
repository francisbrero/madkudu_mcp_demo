import { HydrateClient } from "~/trpc/server";
import ApiTester from "../_components/ApiTester";
import { FlaskConical } from "lucide-react";

export default function McpTestPage() {
  return (
    <HydrateClient>
      <div className="container mx-auto px-4 flex flex-col h-full overflow-hidden">
        <div className="py-6 flex-shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
              <FlaskConical className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                API Tester
              </h1>
              <p className="text-sm text-white/70">
                Test individual MadKudu API endpoints with custom inputs
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ApiTester />
        </div>
        <div className="py-4 flex-shrink-0">
          <p className="text-xs text-white/50 text-center">
            🛡️ Privacy Notice: This is a preview environment. Data is not stored or used beyond your session.
          </p>
        </div>
      </div>
    </HydrateClient>
  );
} 