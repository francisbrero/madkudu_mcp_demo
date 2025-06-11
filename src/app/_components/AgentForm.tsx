"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { api } from "~/trpc/react";
import { apiOptions } from "~/data/apiOptions";

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

export default function AgentForm({ agent }: { agent?: Agent }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: agent?.name || "",
    description: agent?.description || "",
    systemPrompt: agent?.systemPrompt || "",
    allowedApis: agent?.allowedApis || [],
    inputType: agent?.inputType || "freeform",
    outputFormat: agent?.outputFormat || "markdown",
    active: agent?.active ?? true,
  });

  const utils = api.useUtils();

  const handleMutationSuccess = () => {
    utils.agent.getAll.invalidate();
    router.push('/agents');
    router.refresh(); 
  };

  const createMutation = api.agent.create.useMutation({ onSuccess: handleMutationSuccess });
  const updateMutation = api.agent.update.useMutation({ onSuccess: handleMutationSuccess });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleApiToggle = (apiId: string) => {
    setFormData(prev => {
      const newApis = prev.allowedApis.includes(apiId)
        ? prev.allowedApis.filter(id => id !== apiId)
        : [...prev.allowedApis, apiId];
      return { ...prev, allowedApis: newApis };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, allowedApis: JSON.stringify(formData.allowedApis) };
    if (agent?.id) {
      updateMutation.mutate({ id: agent.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };
  
  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditing = !!agent;

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl">
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Agent Name & Description */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-white mb-3">
              Agent Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 placeholder-white/50"
              placeholder="Enter agent name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-white mb-3">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 placeholder-white/50"
              placeholder="Brief description of the agent"
              required
            />
          </div>
        </div>
        
        {/* System Prompt */}
        <div>
          <label htmlFor="systemPrompt" className="block text-sm font-semibold text-white mb-3">
            System Prompt
          </label>
          <textarea
            id="systemPrompt"
            name="systemPrompt"
            value={formData.systemPrompt}
            onChange={handleInputChange}
            rows={8}
            className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 placeholder-white/50 font-mono text-sm leading-relaxed custom-scrollbar"
            placeholder="Define the agent's behavior and capabilities..."
            required
          />
        </div>
        
        {/* Allowed API Calls */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Allowed API Calls</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {apiOptions.map(api => (
              <div key={api.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all duration-200">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id={`api-${api.id}`}
                    checked={formData.allowedApis.includes(api.id)}
                    onChange={() => handleApiToggle(api.id)}
                    className="mt-0.5 h-4 w-4 rounded border-white/30 text-blue-500 focus:ring-blue-500/30 bg-white/10 accent-blue-500"
                  />
                  <label htmlFor={`api-${api.id}`} className="flex-1 cursor-pointer">
                    <span className="font-medium text-white text-sm block mb-0.5">{api.name}</span>
                    <p className="text-xs text-white/60 leading-tight">{api.description}</p>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Configuration Options */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="inputType" className="block text-sm font-semibold text-white mb-3">
              Input Mode
            </label>
            <select
              id="inputType"
              name="inputType"
              value={formData.inputType}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
            >
              {inputTypes.map(type => (
                <option key={type.id} value={type.id} className="bg-gray-800 text-white">{type.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="outputFormat" className="block text-sm font-semibold text-white mb-3">
              Output Format
            </label>
            <select
              id="outputFormat"
              name="outputFormat"
              value={formData.outputFormat}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
            >
              {outputFormats.map(format => (
                <option key={format.id} value={format.id} className="bg-gray-800 text-white">{format.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Status
            </label>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 h-12 flex items-center">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-white/30 text-blue-500 focus:ring-blue-500/30 bg-white/10 accent-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-white cursor-pointer">
                  Active (Available on Homepage)
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-white/10">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading && (
              <div className="animate-spin h-4 w-4">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {isEditing ? (isLoading ? "Updating..." : "Update Agent") : (isLoading ? "Creating..." : "Create Agent")}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/agents')}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 shadow-lg font-semibold text-sm border border-white/20"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} 