/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
    /** Jobcan URL for playwright */
    JOBCAN_URL?: string;
    /** Exit method for playwright process */
    EXIT_METHOD?: string;
  }
}

// Import types for settings
import type { AppConfig } from "./src/main/store/settings";

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import("electron").IpcRenderer;
  electronAPI: {
    // Playwright operations
    openJobcan: () => Promise<void>;
    openSlackWF: () => Promise<void>;

    // Configuration management
    config: {
      getAll: () => Promise<AppConfig>;
      getJobcan: () => Promise<
        AppConfig["jobcan"] & { url: string; isConfigured: boolean }
      >;
      setJobcanCredentials: (
        email: string,
        password: string,
      ) => Promise<AppConfig["jobcan"] & { isConfigured: boolean }>;
      setJobcanCredentials: (
        email: string,
        password: string,
      ) => Promise<AppConfig["jobcan"]>;
      setJobcanUrl: (url: string) => Promise<{ url: string }>;
      clearJobcan: () => Promise<AppConfig["jobcan"]>;
      testJobcan: () => Promise<{ success: boolean; message: string }>;
      setSetting: (
        key: keyof AppConfig["settings"],
        value: boolean,
      ) => Promise<AppConfig["settings"]>;
      getDebugInfo: () => Promise<{
        configPath: string;
        isJobcanConfigured: boolean;
        configSize: number;
      }>;
    };
  };
}
