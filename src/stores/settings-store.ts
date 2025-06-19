import { create } from 'zustand';

type MCPStatus = 'unvalidated' | 'validating' | 'valid' | 'invalid';

interface SettingsState {
  madkuduApiKey: string;
  openaiApiKey: string;
  mcpStatus: MCPStatus;
  setMadkuduApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setMcpStatus: (status: MCPStatus) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  madkuduApiKey: '',
  openaiApiKey: '',
  mcpStatus: 'unvalidated',
  setMadkuduApiKey: (key) => set({ madkuduApiKey: key }),
  setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
  setMcpStatus: (status) => set({ mcpStatus: status }),
})); 