"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Edit, Copy, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { apiOptions } from '~/data/apiOptions';

const inputTypes = [
  { id: "email", name: "Email Address" },
  { id: "domain", name: "Domain" },
  { id: "freeform", name: "Freeform" },
];

const outputFormats = [
  { id: "markdown", name: "Markdown" },
  { id: "json", name: "JSON" },
];

type Agent = {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  allowedApis: string[];
  inputType: string;
  outputFormat: string;
  active: boolean;
};

export default function AgentCard({ agent, handleDelete }: {
  agent: Agent;
  handleDelete: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl transition-all duration-200 hover:bg-white/10 hover:shadow-3xl">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white truncate">{agent.name}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                agent.active 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-white/10 text-white/60 border border-white/20'
              }`}>
                {agent.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed mb-3">{agent.description}</p>
            
            {/* API Access in non-expanded view */}
            {agent.allowedApis.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-white/60 text-xs font-medium">API Access:</span>
                {agent.allowedApis.map(api => (
                  <span 
                    key={api}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-md border border-blue-500/30 text-xs font-medium"
                  >
                    {apiOptions.find(o => o.id === api)?.name || api}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Link 
              href={`/agents/edit/${agent.id}`} 
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all duration-200" 
              title="Edit Agent"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <Link 
              href={`/agents/create?from=${agent.id}`} 
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all duration-200" 
              title="Duplicate Agent"
            >
              <Copy className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(agent.id); }}
              className="p-2 text-white/60 hover:text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-200"
              title="Delete Agent"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button 
              className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-all duration-200 ml-1" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
            </button>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-white/10 bg-white/5 p-4 rounded-b-2xl">
          <div className="space-y-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/70">
                    <span className="font-semibold text-white/90">Input Type:</span> {inputTypes.find(t => t.id === agent.inputType)?.name || agent.inputType}
                  </span>
                </div>
                <div>
                  <span className="text-white/70">
                    <span className="font-semibold text-white/90">Output Format:</span> {outputFormats.find(f => f.id === agent.outputFormat)?.name || agent.outputFormat}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex-1">
              <span className="font-semibold text-white/90 text-sm block mb-3">System Prompt</span>
              <div className="bg-black/30 border border-white/10 rounded-md p-4 h-64 overflow-y-auto custom-scrollbar">
                <pre className="text-white/80 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                  {agent.systemPrompt}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 