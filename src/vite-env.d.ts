/// <reference types="vite/client" />

declare global {
  interface Window {
    electronAPI: {
      openJobcan: () => Promise<void>;
      openSlackWF: () => Promise<void>;
    };
  }
}

export {};
