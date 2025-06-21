"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, MessageSquare, Users, Settings, Sparkles } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/playground", label: "Playground", icon: Wrench },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/agents", label: "Agents", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-card flex h-screen w-64 flex-col border-r border-white/10 bg-white/5 px-4 py-8">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold gradient-text">MadKudu MCP</h1>
          <p className="text-xs text-muted-foreground">Model Context Provider</p>
        </div>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
                           (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar-item ${
                    isActive ? "sidebar-item-active" : ""
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-white/10">
        <div className="text-xs text-muted-foreground text-center">
          <p>Connected to MCP Server</p>
          <div className="mt-1 flex items-center justify-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
} 