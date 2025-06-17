"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

type ApiOption = {
  id: string;
  name: string;
  description: string;
};

const apiOptions: ApiOption[] = [
  { id: "lookupAccount", name: "Account Lookup", description: "Get firmographic data for a company" },
  { id: "lookupPerson", name: "Person Lookup", description: "Get data about a specific contact" },
  { id: "getAccountDetails", name: "Account Details", description: "Get detailed account information" },
  { id: "getContactDetails", name: "Contact Details", description: "Get detailed contact information" },
  { id: "getAIResearch", name: "AI Research", description: "Get AI-generated company research" },
];

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

export default function AgentBuilder() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<Agent, 'id'>>({
    name: "",
    description: "",
    systemPrompt: "",
    allowedApis: [],
    inputType: "freeform",
    outputFormat: "markdown",
    active: true
  });
  
  // TRPC hooks for agent operations
  const { data: agentsData, isLoading, refetch } = api.agent.getAll.useQuery();
  const createMutation = api.agent.create.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    }
  });
  const updateMutation = api.agent.update.useMutation({
    onSuccess: () => {
      resetForm();
      refetch();
    }
  });
  const deleteMutation = api.agent.delete.useMutation({
    onSuccess: () => refetch()
  });
  
  useEffect(() => {
    if (agentsData) {
      setAgents(agentsData.map(agent => ({
        ...agent,
        allowedApis: JSON.parse(agent.allowedApis)
      })));
    }
  }, [agentsData]);
  
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      systemPrompt: "",
      allowedApis: [],
      inputType: "freeform",
      outputFormat: "markdown",
      active: true
    });
    setIsEditing(false);
    setEditingId(null);
  };
  
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
      const apiExists = prev.allowedApis.includes(apiId);
      
      if (apiExists) {
        return {
          ...prev,
          allowedApis: prev.allowedApis.filter(id => id !== apiId)
        };
      } else {
        return {
          ...prev,
          allowedApis: [...prev.allowedApis, apiId]
        };
      }
    });
  };
  
  const handleEdit = (agent: Agent) => {
    setFormData({
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      allowedApis: agent.allowedApis,
      inputType: agent.inputType,
      outputFormat: agent.outputFormat,
      active: agent.active
    });
    setIsEditing(true);
    setEditingId(agent.id);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        allowedApis: JSON.stringify(formData.allowedApis)
      });
    } else {
      createMutation.mutate({
        ...formData,
        allowedApis: JSON.stringify(formData.allowedApis)
      });
    }
  };
  
  const handleDuplicate = (agent: Agent) => {
    setFormData({
      name: `${agent.name} (Copy)`,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      allowedApis: agent.allowedApis,
      inputType: agent.inputType,
      outputFormat: agent.outputFormat,
      active: false
    });
    setIsEditing(false);
    setEditingId(null);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? "Edit Agent" : "Create New Agent"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Agent Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-300 mb-1">
              System Prompt
            </label>
            <textarea
              id="systemPrompt"
              name="systemPrompt"
              value={formData.systemPrompt}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-300 mb-3">Allowed API Calls</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {apiOptions.map(api => (
                <div key={api.id} className="flex items-start">
                  <input
                    type="checkbox"
                    id={`api-${api.id}`}
                    checked={formData.allowedApis.includes(api.id)}
                    onChange={() => handleApiToggle(api.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <label htmlFor={`api-${api.id}`} className="ml-2 block text-sm">
                    <span className="font-medium text-gray-200">{api.name}</span>
                    <p className="text-xs text-gray-400">{api.description}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="inputType" className="block text-sm font-medium text-gray-300 mb-1">
                Input Mode
              </label>
              <select
                id="inputType"
                name="inputType"
                value={formData.inputType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {inputTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="outputFormat" className="block text-sm font-medium text-gray-300 mb-1">
                Output Format
              </label>
              <select
                id="outputFormat"
                name="outputFormat"
                value={formData.outputFormat}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {outputFormats.map(format => (
                  <option key={format.id} value={format.id}>{format.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
              />
              <label htmlFor="active" className="ml-2 block text-sm font-medium text-white">
                Active (Available on Homepage)
              </label>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing ? (updateMutation.isPending ? "Updating..." : "Update Agent") : (createMutation.isPending ? "Creating..." : "Create Agent")}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Existing Agents</h2>
        
        {isLoading ? (
          <p className="text-gray-400">Loading agents...</p>
        ) : agents.length === 0 ? (
          <p className="text-gray-400">No agents created yet. Create your first agent above.</p>
        ) : (
          <div className="space-y-4">
            {agents.map(agent => (
              <div key={agent.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-medium text-white">{agent.name}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${agent.active ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-300'}`}>
                      {agent.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(agent)}
                      className="p-2 text-gray-300 hover:text-white"
                      title="Edit Agent"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDuplicate(agent)}
                      className="p-2 text-gray-300 hover:text-white"
                      title="Duplicate Agent"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(agent.id)}
                      className="p-2 text-gray-300 hover:text-red-400"
                      title="Delete Agent"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-3">{agent.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-400">
                  <div>
                    <span className="font-medium">Input Type:</span> {inputTypes.find(t => t.id === agent.inputType)?.name || agent.inputType}
                  </div>
                  <div>
                    <span className="font-medium">Output Format:</span> {outputFormats.find(f => f.id === agent.outputFormat)?.name || agent.outputFormat}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium">API Access:</span> {agent.allowedApis.length > 0 ? 
                      agent.allowedApis.map(api => apiOptions.find(o => o.id === api)?.name || api).join(", ") : 
                      "None"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 