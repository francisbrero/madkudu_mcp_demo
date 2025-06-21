'use client';

import { useState, useEffect } from 'react';
import { api } from '~/trpc/react';
import { useSettingsStore, type MCPStatus } from '~/stores/settings-store';
import { Settings, Sparkles, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';

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
        return (
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle className="h-4 w-4" />
            Valid & Saved
          </span>
        );
      case "invalid":
        return (
          <span className="flex items-center gap-1 text-red-400">
            <XCircle className="h-4 w-4" />
            Invalid
          </span>
        );
      case "validating":
        return (
          <span className="flex items-center gap-1 text-yellow-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Validating...
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="animate-fade-in mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Configure your API keys and connections</p>
            </div>
          </div>
          <div className="glass-card p-4 rounded-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              API keys are validated against live services before being saved.
            </p>
          </div>
        </div>

        <div className="space-y-8 max-w-2xl">
          <div className="glass-card p-6 rounded-xl animate-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">MadKudu MCP Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  MCP API Key
                </label>
                <input
                  type="password"
                  value={madkuduApiKey}
                  onChange={(e) => setMadkuduApiKey(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your MCP API key"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleValidateMcp}
                  disabled={!madkuduApiKey || validateMcpMutation.isPending}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validateMcpMutation.isPending ? "Validating..." : "Validate & Save"}
                </button>
                <div>{getStatusComponent(mcpStatus)}</div>
              </div>
              {mcpError && <div className="text-sm text-red-400">{mcpError}</div>}
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">OpenAI Settings</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={openAIApiKeyInput}
                  onChange={(e) => setOpenAIApiKeyInput(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your OpenAI API key"
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleValidateOpenai}
                  disabled={!openAIApiKeyInput || validateOpenaiMutation.isPending}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validateOpenaiMutation.isPending ? "Validating..." : "Validate & Save"}
                </button>
                <div>{getStatusComponent(openaiStatus)}</div>
              </div>
              {openaiError && <div className="text-sm text-red-400">{openaiError}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 