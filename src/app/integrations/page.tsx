"use client";
import Image from "next/image";
import { Puzzle } from "lucide-react";

const integrations = [
  { name: "Cursor", description: "The AI-first code editor.", logo: "/cursor_logo.svg" },
  { name: "Claude", description: "A next-generation AI assistant for your tasks, no matter the scale.", logo: "/claude_logo.svg" },
  { name: "Windsurf", description: "Build and deploy AI-native applications.", logo: "/windsurf_logo.svg" },
  { name: "Dust", description: "Design and deploy large language model apps.", logo: "/dust_logo.svg" },
  { name: "ChatGPT", description: "The original AI assistant for everyday tasks.", logo: "/chatgpt_logo.svg", comingSoon: true },
];

export default function IntegrationsPage() {
  const cursorInstallUrl = "cursor://anysphere.cursor-deeplink/mcp/install?name=MadMCP&config=eyJ1cmwiOiJodHRwczovL21jcC5tYWRrdWR1LmNvbS97QVBJX0tFWX0vbWNwIn0=";

  return (
    <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
            <Puzzle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white mb-1">
              Integrations
            </h1>
            <p className="text-xs text-white/70">
              Connect your favorite tools and services
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:bg-white/10"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center p-2">
                  <Image
                    src={integration.logo}
                    alt={`${integration.name} logo`}
                    width={24}
                    height={24}
                    className="rounded"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {integration.name}
                    </h3>
                    {integration.comingSoon && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded-full border border-green-500/30">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70 mb-3">
                    {integration.description}
                  </p>
                  {integration.name === "Cursor" && (
                    <div className="mt-6">
                      <a
                        href={cursorInstallUrl}
                        className="w-full block text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg text-sm"
                      >
                        + Add to Cursor
                      </a>
                    </div>
                  )}
                  {integration.name === "Claude" && (
                    <div className="mt-6">
                      <a
                        href="https://claude.ai/settings/integrations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg text-sm"
                      >
                        + Add to Claude
                      </a>
                    </div>
                  )}
                  {integration.name === "Dust" && (
                    <div className="mt-6">
                      <a
                        href="https://madkudu.gitbook.io/api/madkudu-mcp/install-in-ai-platforms-in-2min/dust"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg text-sm"
                      >
                        + Add to Dust
                      </a>
                    </div>
                  )}
                  {integration.name === "Windsurf" && (
                    <div className="mt-6">
                      <a
                        href="https://madkudu.gitbook.io/api/madkudu-mcp/install-in-ai-platforms-in-2min/windsurf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg text-sm"
                      >
                        + Add to Windsurf
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
} 