'use client';

import { useState, useEffect } from 'react';
import { api } from '~/trpc/react';
import { useSettingsStore, type MCPStatus } from '~/stores/settings-store';

export default function SettingsPage() {
  const { 
    madkuduApiKey: storedMadkuduApiKey,
    openAIApiKey: storedOpenAIApiKey,
    mcpStatus,
    openaiStatus,
    setMadkuduApiKey: saveMadkuduApiKey,
    setOpenAIApiKey: saveOpenAIApiKey,
    setMcpStatus,
    setOpenaiStatus
  } = useSettingsStore();
  
  const [madkuduApiKey, setMadkuduApiKey] = useState("");
  const [openAIApiKeyInput, setOpenAIApiKeyInput] = useState("");
  
  const [mcpError, setMcpError] = useState("");
  const [openaiError, setOpenaiError] = useState("");

  useEffect(() => {
    setMadkuduApiKey(storedMadkuduApiKey);
    setOpenAIApiKeyInput(storedOpenAIApiKey);
  }, [storedMadkuduApiKey, storedOpenAIApiKey]);

  const validateMcpMutation = api.mcp.validateKey.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMcpStatus("valid");
        saveMadkuduApiKey(madkuduApiKey);
        setMcpError("");
      } else {
        setMcpStatus("invalid");
        setMcpError(data.error ?? "MCP validation failed");
      }
    },
    onError: (err) => {
      setMcpStatus("invalid");
      setMcpError(err.message);
    },
    onMutate: () => {
      setMcpStatus("validating");
      setMcpError("");
    }
  });

  const validateOpenaiMutation = api.mcp.validateOpenAIKey.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setOpenaiStatus("valid");
        saveOpenAIApiKey(openAIApiKeyInput);
        setOpenaiError("");
      } else {
        setOpenaiStatus("invalid");
        setOpenaiError(data.error ?? "OpenAI validation failed");
      }
    },
    onError: (err) => {
      setOpenaiStatus("invalid");
      setOpenaiError(err.message);
    },
    onMutate: () => {
      setOpenaiStatus("validating");
      setOpenaiError("");
    }
  });

  const handleValidateMcp = () => {
    validateMcpMutation.mutate({ apiKey: madkuduApiKey });
  };

  const handleValidateOpenai = () => {
    validateOpenaiMutation.mutate({ apiKey: openAIApiKeyInput });
  };
  
  const getStatusComponent = (status: MCPStatus) => {
    switch (status) {
      case "valid":
        return <span className="text-green-600">✓ Valid & Saved</span>;
      case "invalid":
        return <span className="text-red-600">✗ Invalid</span>;
      case "validating":
        return <span className="text-yellow-600">Validating...</span>;
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-bold">MadKudu MCP Settings</h2>
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                MCP API Key
              </label>
              <input
                type="password"
                value={madkuduApiKey}
                onChange={(e) => setMadkuduApiKey(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Enter your MCP API key"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleValidateMcp}
                disabled={!madkuduApiKey || validateMcpMutation.isPending}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {validateMcpMutation.isPending ? "Validating..." : "Validate & Save"}
              </button>
              <div>{getStatusComponent(mcpStatus)}</div>
            </div>
            {mcpError && <div className="text-sm text-red-600">{mcpError}</div>}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold">OpenAI Settings</h2>
          <div className="space-y-4 rounded-lg border p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openAIApiKeyInput}
                onChange={(e) => setOpenAIApiKeyInput(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                placeholder="Enter your OpenAI API key"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleValidateOpenai}
                disabled={!openAIApiKeyInput || validateOpenaiMutation.isPending}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {validateOpenaiMutation.isPending ? "Validating..." : "Validate & Save"}
              </button>
              <div>{getStatusComponent(openaiStatus)}</div>
            </div>
            {openaiError && <div className="text-sm text-red-600">{openaiError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
} 