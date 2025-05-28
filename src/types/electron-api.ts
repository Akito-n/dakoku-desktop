import type { CheckActionType } from "./check";

// === 共通のElectronAPI型定義 ===
export interface ElectronAPI {
  // Playwright operations
  openJobcan: () => Promise<void>;
  openSlackWF: () => Promise<void>;

  jobcan: {
    execute: (action: CheckActionType) => Promise<{
      success: boolean;
      message: string;
    }>;
  };

  // Configuration management
  config: {
    getAll: () => Promise<{
      urls: { jobcan: string; slackwf: string };
      jobcan: { email: string; password: string };
      slackwf: { email: string; password: string };
      settings: { autoLogin: boolean; rememberCredentials: boolean };
    }>;
    getJobcan: () => Promise<{
      email: string;
      password: string;
      url: string;
      isConfigured: boolean;
    }>;
    setJobcanCredentials: (
      email: string,
      password: string,
    ) => Promise<{
      email: string;
      password: string;
      isConfigured: boolean;
    }>;
    setJobcanUrl: (url: string) => Promise<{ url: string }>;
    clearJobcan: () => Promise<{
      email: string;
      password: string;
      isConfigured: boolean;
    }>;
    testJobcan: () => Promise<{ success: boolean; message: string }>;
    getAttendance: () => Promise<{
      startTime: string;
      endTime: string;
    }>;
    setAttendance: (
      startTime: string,
      endTime: string,
    ) => Promise<{
      startTime: string;
      endTime: string;
    }>;

    setSetting: (
      key: "autoLogin" | "rememberCredentials",
      value: boolean,
    ) => Promise<{
      autoLogin: boolean;
      rememberCredentials: boolean;
    }>;
    getDebugInfo: () => Promise<{
      configPath: string;
      isJobcanConfigured: boolean;
      configSize: number;
    }>;
  };
}
