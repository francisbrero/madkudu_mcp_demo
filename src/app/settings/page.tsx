'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import { useSettingsStore } from '~/stores/settings-store';

export default function SettingsPage() {
  const { madkuduApiKey, openaiApiKey, mcpStatus, setMadkuduApiKey, setOpenaiApiKey, setMcpStatus } = useSettingsStore();
  const [error, setError] = useState<string | null>(null);

  const validateKeyMutation = api.mcp.validateKey.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMcpStatus('valid');
        setError(null);
      } else {
        setMcpStatus('invalid');
        setError(data.error ?? 'Validation failed');
      }
    },
    onError: (err) => {
      setMcpStatus('invalid');
      setError(err.message);
    },
  });

  const handleValidate = async () => {
    if (!madkuduApiKey) {
      setError('MadKudu API Key is required');
      return;
    }

    setMcpStatus('validating');
    setError(null);
    validateKeyMutation.mutate({ apiKey: madkuduApiKey });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-2xl font-bold">Settings</h1>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="madkudu-key" className="block font-medium">
            MadKudu API Key
          </label>
          <input
            id="madkudu-key"
            type="password"
            value={madkuduApiKey}
            onChange={(e) => setMadkuduApiKey(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
            placeholder="Enter your MadKudu API key"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="openai-key" className="block font-medium">
            OpenAI API Key
          </label>
          <input
            id="openai-key"
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-black"
            placeholder="Enter your OpenAI API key"
          />
        </div>

        <div className="space-y-4">
          <button
            onClick={handleValidate}
            disabled={mcpStatus === 'validating'}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400"
          >
            {mcpStatus === 'validating' ? 'Validating...' : 'Validate Keys'}
          </button>

          {error && (
            <div className="rounded-md bg-red-100 p-4 text-red-700">
              {error}
            </div>
          )}

          {mcpStatus === 'valid' && (
            <div className="rounded-md bg-green-100 p-4 text-green-700">
              API keys validated successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 