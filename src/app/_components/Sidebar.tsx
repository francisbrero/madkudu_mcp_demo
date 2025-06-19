"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wrench, MessageSquare, Users, Settings } from "lucide-react";

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
    <aside className="flex h-screen w-64 flex-col border-r bg-white px-4 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold">MadKudu MCP</h1>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
} 