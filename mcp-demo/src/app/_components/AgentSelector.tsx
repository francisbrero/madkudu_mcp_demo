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
    <div className="relative mb-4">
      <div className="flex items-center">
        <span className="text-sm font-medium text-gray-300 mr-3">{label}</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-[rgb(var(--color-primary))] text-white rounded flex items-center space-x-2 hover:bg-[rgb(var(--color-primary-dark))] transition-colors duration-150"
        >
          <span>{selectedAgent.name}</span>
          <svg
            className={`h-4 w-4 ml-2 transition-transform ${
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
        <div className="absolute left-0 mt-2 w-64 bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-primary))] rounded-md shadow-lg z-10">
          <ul>
            {agents.map((agent) => (
              <li key={agent.id}>
                <button
                  onClick={() => {
                    onSelectAgent(agent);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[rgba(var(--color-primary),0.15)] transition-colors duration-150 ${
                    selectedAgent.id === agent.id
                      ? "bg-[rgba(var(--color-primary),0.2)]"
                      : "bg-transparent"
                  }`}
                >
                  <div className="text-white font-medium">{agent.name}</div>
                  <div className="text-xs text-gray-300">
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