'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import { useSettingsStore } from '~/stores/settings-store';

export default function SettingsPage() {
  const { madkuduApiKey, openaiApiKey, mcpStatus, setMadkuduApiKey, setOpenaiApiKey, setMcpStatus } = useSettingsStore();
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateKeyMutation = api.mcp.validateKey.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMcpStatus('valid');
        setValidationError(null);
      } else {
        setMcpStatus('invalid');
        setValidationError(data.error ?? 'Validation failed');
      }
    },
    onError: (error) => {
      setMcpStatus('invalid');
      setValidationError(error.message);
    },
  });

  const handleValidate = async () => {
    if (!madkuduApiKey) {
      setValidationError('MadKudu API key is required');
      return;
    }
    if (!openaiApiKey) {
      setValidationError('OpenAI API key is required');
      return;
    }
    setMcpStatus('validating');
    validateKeyMutation.mutate({ 
      apiKey: madkuduApiKey,
      openaiApiKey: openaiApiKey
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-2xl font-bold">Settings</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            MadKudu API Key
          </label>
          <input
            type="password"
            value={madkuduApiKey}
            onChange={(e) => setMadkuduApiKey(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your MadKudu API key"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter your OpenAI API key"
          />
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleValidate}
            disabled={mcpStatus === 'validating'}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {mcpStatus === 'validating' ? 'Validating...' : 'Validate Keys'}
          </button>

          {mcpStatus === 'valid' && (
            <span className="text-sm text-green-600">✓ Keys validated successfully</span>
          )}
          
          {validationError && (
            <span className="text-sm text-red-600">{validationError}</span>
          )}
        </div>
      </div>
    </div>
  );
} 