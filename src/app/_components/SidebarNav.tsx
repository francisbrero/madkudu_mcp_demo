"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Bot, FlaskConical, BookOpen, ExternalLink, Puzzle } from "lucide-react";

const navItems = [
  {
    href: "/",
    label: "Playground",
    icon: MessageCircle,
    aria: "Playground (Home)",
  },
  {
    href: "/agents",
    label: "Agent Builder",
    icon: Bot,
    aria: "Agent Builder",
  },
  {
    href: "/mcp-test",
    label: "API Tester",
    icon: FlaskConical,
    aria: "API Tester",
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex flex-col bg-white/5 backdrop-blur-sm text-[rgb(var(--color-text))] w-60 py-6 px-4 shadow-2xl justify-between border-r border-white/10"
      aria-label="Main navigation"
    >
      <div>
        <div className="mb-8 pl-2 select-none">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-white">MadKudu</div>
              <div className="text-xs text-white/60 font-medium">MCP Demo</div>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon, aria }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-label={aria}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                    ${active 
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg" 
                      : "hover:bg-white/10 hover:text-white text-white/70 border border-transparent hover:border-white/10"
                    }
                    relative
                  `}
                  tabIndex={0}
                >
                  <div className={`p-2 rounded-lg transition-colors ${active ? "bg-blue-500/20" : "bg-white/5 group-hover:bg-white/10"}`}>
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </div>
                  <span className="truncate">{label}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-8">
        <div className="border-t border-white/10 mb-4" />
        <div className="space-y-2">
          <Link
            href="/integrations"
            className="group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 shadow-lg border border-blue-500/30"
            aria-label="Integrate in my AI"
          >
            <div className="p-2 rounded-lg bg-white/10">
              <Puzzle className="w-4 h-4 shrink-0" aria-hidden="true" />
            </div>
            <span className="truncate font-semibold">Integrate in my AI</span>
          </Link>
          <a
            href="https://madkudu.gitbook.io/api"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-white/70 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Documentation (opens in new tab)"
          >
            <span className="truncate">Documentation</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-70 group-hover:opacity-100" aria-hidden="true" />
          </a>
        </div>
      </div>
    </nav>
  );
} 