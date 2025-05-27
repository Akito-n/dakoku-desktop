import Store from "electron-store";

// 設定の型定義
export interface AppConfig {
  urls: {
    jobcan: string;
    slackwf: string;
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
  settings: {
    autoLogin: false,
    rememberCredentials: false,
  },
};

// electron-storeのインスタンス作成
export const configStore = new Store<AppConfig>({
  name: "dakoku-config",
  defaults: defaultConfig,
  // 将来の暗号化に備えてencryptionKeyを設定可能にしておく
  // encryptionKey: 'your-encryption-key', // 後で実装
});

// 設定取得のヘルパー関数
export const getJobcanUrl = (): string => {
  return configStore.get("urls.jobcan");
};

export const getSlackWFUrl = (): string => {
  return configStore.get("urls.slackwf");
};

// 設定更新のヘルパー関数
export const setJobcanUrl = (url: string): void => {
  configStore.set("urls.jobcan", url);
};

export const setSlackWFUrl = (url: string): void => {
  configStore.set("urls.slackwf", url);
};

// 全設定取得
export const getAllConfig = (): AppConfig => {
  return configStore.store;
};

// 設定リセット
export const resetConfig = (): void => {
  configStore.clear();
};
