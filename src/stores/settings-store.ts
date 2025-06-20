import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type MCPStatus = 'unvalidated' | 'validating' | 'valid' | 'invalid';

interface SettingsState {
  madkuduApiKey: string;
  openAIApiKey: string;
  mcpStatus: MCPStatus;
  openaiStatus: MCPStatus;
  setMadkuduApiKey: (key: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setMcpStatus: (status: MCPStatus) => void;
  setOpenaiStatus: (status: MCPStatus) => void;
}

export const useSettingsStore = create(
  persist<SettingsState>(
    (set) => ({
      madkuduApiKey: '',
      openAIApiKey: '',
      mcpStatus: 'unvalidated',
      openaiStatus: 'unvalidated',
      setMadkuduApiKey: (key) => set({ madkuduApiKey: key }),
      setOpenAIApiKey: (key) => set({ openAIApiKey: key }),
      setMcpStatus: (status) => set({ mcpStatus: status }),
      setOpenaiStatus: (status) => set({ openaiStatus: status }),
    }),
    {
      name: 'settings-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    },
  ),
); 