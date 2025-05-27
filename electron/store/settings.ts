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
    email: string;
    password: string;
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
    email: "",
    password: "",
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

export const setSlackWFUrl = (url: string): void => {
  settingStore.set("urls.slackwf", url);
};

// 全設定取得
export const getAllConfig = (): AppConfig => {
  return settingStore.store;
};

// Jobcan設定の取得・更新
export const getJobcanConfig = () => {
  return settingStore.get("jobcan");
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
