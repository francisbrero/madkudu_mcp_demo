"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Bot, FlaskConical, Puzzle, BookOpen } from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Playground", icon: MessageSquare },
    { href: "/agents", label: "Agent Builder", icon: Bot },
    { href: "/api-tester", label: "API Tester", icon: FlaskConical },
    { href: "/integrations", label: "Integrations", icon: Puzzle },
    { href: "https://docs.madkudu.com", label: "Documentation", external: true },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">MadKudu</div>
            <div className="text-xs text-white/60">MCP Demo</div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isExternal = item.external;
            const active = !isExternal && isActive(item.href);
            const Icon = item.icon;

            const content = (
              <div className={`
                flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 text-sm relative
                ${active 
                  ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30" 
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }
              `}>
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
                )}
                {Icon && <Icon className={`w-4 h-4 ${active ? "text-blue-400" : ""}`} />}
                <span className="font-medium">{item.label}</span>
              </div>
            );

            return (
              <li key={item.href}>
                {isExternal ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  <Link href={item.href}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* CTA */}
      <div className="p-3 border-t border-white/10">
        <Link 
          href="https://www.madkudu.com" 
          className="block w-full px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-xl text-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
        >
          Learn More
        </Link>
      </div>
    </div>
  );
} 