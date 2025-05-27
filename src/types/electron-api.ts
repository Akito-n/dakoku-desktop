// === 共通のElectronAPI型定義 ===
export interface ElectronAPI {
  // Playwright operations
  openJobcan: () => Promise<void>;
  openSlackWF: () => Promise<void>;

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
