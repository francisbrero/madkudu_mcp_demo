"use client";

import { useState } from "react";
import { Agent } from "./ChatInterface";

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
    <div className="relative">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-1 bg-purple-800 text-white rounded flex items-center space-x-2 hover:bg-purple-700"
        >
          <span>{selectedAgent.name}</span>
          <svg
            className={`h-4 w-4 transition-transform ${
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
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-purple-700 rounded-md shadow-lg z-10">
          <ul>
            {agents.map((agent) => (
              <li key={agent.id}>
                <button
                  onClick={() => {
                    onSelectAgent(agent);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-purple-900 ${
                    selectedAgent.id === agent.id
                      ? "bg-purple-800"
                      : "bg-transparent"
                  }`}
                >
                  <div className="text-white">{agent.name}</div>
                  <div className="text-xs text-gray-400">
                    {agent.description}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 