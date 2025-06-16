"use client";

import { useState } from "react";
import type { Agent } from "./ChatInterface";

type AgentSelectorProps = {
  agents: Agent[];
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
  label: string;
};

export default function AgentSelector({
  agents,
  selectedAgent,
  onSelectAgent,
  label,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <span className="text-base font-semibold text-white/90">{label}</span>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl flex items-center gap-2 hover:bg-white/20 transition-all duration-200 border border-white/20 shadow-lg min-w-[180px] justify-between"
        >
          <div className="text-left">
            <div className="font-medium text-sm">{selectedAgent.name}</div>
            <div className="text-xs text-white/70 truncate">{selectedAgent.description}</div>
          </div>
          <svg
            className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shadow-2xl z-20 overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              {agents.map((agent, index) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-white/20 transition-colors duration-150 ${
                    selectedAgent.id === agent.id
                      ? "bg-white/15"
                      : "bg-transparent"
                  } ${index === 0 ? "" : "border-t border-white/10"}`}
                >
                  <div className="text-white font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-white/70 mt-0.5 leading-relaxed">
                    {agent.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 