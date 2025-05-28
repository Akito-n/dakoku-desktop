import Store from "electron-store";

// 設定の型定義
export interface AppConfig {
  urls: {
    jobcan: string;
    slackwf: string;
  };
  jobcan: {
    email: string;
    password: string;
  };
  slackwf: {
    workspaceName: string;
    googleEmail: string;
    googlePassword: string;
    targetChannelUrl: string;
  };
  attendance: {
    startTime: string; // "09:00" HH:MM形式
    endTime: string; // "18:00" HH:MM形式
  };
  // 将来の拡張用
  settings: {
    autoLogin: boolean;
    rememberCredentials: boolean;
  };
}

// デフォルト設定
const defaultConfig: AppConfig = {
  urls: {
    jobcan: "https://id.jobcan.jp/users/sign_in",
    slackwf: "https://workflowplus.com/", // 後で正式URLに変更
  },
  jobcan: {
    email: "",
    password: "",
  },
  slackwf: {
    workspaceName: "",
    googleEmail: "",
    googlePassword: "",
    targetChannelUrl: "",
  },
  attendance: {
    startTime: "09:00",
    endTime: "18:00",
  },
  settings: {
    autoLogin: false,
    rememberCredentials: true,
  },
};

export const settingStore = new Store<AppConfig>({
  name: "dakoku-config",
  defaults: defaultConfig,
  // 将来の暗号化に備えてencryptionKeyを設定可能にしておく
  // encryptionKey: 'your-encryption-key', // 後で実装
});

// 設定取得のヘルパー関数
export const getJobcanUrl = (): string => {
  return settingStore.get("urls.jobcan");
};
export const getSlackWFUrl = (): string => {
  return settingStore.get("urls.slackwf");
};

// 設定更新のヘルパー関数
export const setJobcanUrl = (url: string): void => {
  settingStore.set("urls.jobcan", url);
};

// 全設定取得
export const getAllConfig = (): AppConfig => {
  return settingStore.store;
};

// Jobcan設定の取得・更新
export const getJobcanConfig = () => {
  return settingStore.get("jobcan");
};

export const getAttendanceConfig = () => {
  return settingStore.get("attendance");
};

export const setAttendanceConfig = (
  config: Partial<AppConfig["attendance"]>,
) => {
  const currentConfig = getAttendanceConfig();
  const newConfig = { ...currentConfig, ...config };
  settingStore.set("attendance", newConfig);
  return newConfig;
};

export const formatTimeForJobcan = (time: string): string => {
  // "09:00" -> "0900"
  return time.replace(":", "");
};

export const formatTimeForSlackWF = (time: string): string => {
  // "09:00" -> "9:00", "9:00" -> "9:00", "10:00" -> "10:00"
  const [hours, minutes] = time.split(":");
  const formattedHours = Number.parseInt(hours, 10).toString();
  return `${formattedHours}:${minutes}`;
};

export const setJobcanConfig = (config: Partial<AppConfig["jobcan"]>) => {
  const currentConfig = getJobcanConfig();
  const newConfig = { ...currentConfig, ...config };
  settingStore.set("jobcan", newConfig);
  return newConfig;
};

export const setJobcanCredentials = (email: string, password: string) => {
  return setJobcanConfig({
    email,
    password,
  });
};

export const clearJobcanCredentials = () => {
  return setJobcanConfig({
    email: "",
    password: "",
  });
};

// === SlackWF設定のヘルパー関数 ===

// SlackWF設定の取得・更新
export const getSlackWFConfig = () => {
  return settingStore.get("slackwf");
};

export const setSlackWFConfig = (config: Partial<AppConfig["slackwf"]>) => {
  const currentConfig = getSlackWFConfig();
  const newConfig = { ...currentConfig, ...config };
  settingStore.set("slackwf", newConfig);
  return newConfig;
};

// 個別設定用のヘルパー関数
export const setSlackWFCredentials = (
  workspaceName: string,
  googleEmail: string,
  googlePassword: string,
) => {
  return setSlackWFConfig({
    workspaceName,
    googleEmail,
    googlePassword,
  });
};

export const setSlackWFTargetChannel = (targetChannelUrl: string) => {
  return setSlackWFConfig({
    targetChannelUrl,
  });
};

export const clearSlackWFCredentials = () => {
  return setSlackWFConfig({
    workspaceName: "",
    googleEmail: "",
    googlePassword: "",
    targetChannelUrl: "",
  });
};

export const setSlackWFUrl = (url: string): void => {
  settingStore.set("urls.slackwf", url);
};

export const isSlackWFConfigured = (): boolean => {
  const config = getSlackWFConfig();
  return !!(
    config?.workspaceName &&
    config?.googleEmail &&
    config?.googlePassword
  );
};
