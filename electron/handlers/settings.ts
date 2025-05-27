import type { IpcMainInvokeEvent } from "electron";
import {
  getAllConfig,
  getJobcanConfig,
  setJobcanCredentials,
  clearJobcanCredentials,
  getJobcanUrl,
  setJobcanUrl,
  settingStore,
  type AppConfig,
} from "../store/settings";

// isConfigured判定のヘルパー関数
const isJobcanConfigured = (): boolean => {
  const config = getJobcanConfig();
  return config.email.length > 0 && config.password.length > 0;
};

export const settingsHandlers = {
  // === 全体設定 ===
  "config:get-all": async (_event: IpcMainInvokeEvent): Promise<AppConfig> => {
    console.log("設定全体を取得");
    return getAllConfig();
  },

  // === Jobcan設定 ===
  "config:get-jobcan": async (_event: IpcMainInvokeEvent) => {
    console.log("Jobcan設定を取得");
    const config = getJobcanConfig();
    const url = getJobcanUrl();
    return {
      ...config,
      url,
      isConfigured: isJobcanConfigured(), // 動的に計算
    };
  },

  "config:set-jobcan-credentials": async (
    _event: IpcMainInvokeEvent,
    email: string,
    password: string,
  ) => {
    console.log(`Jobcan認証情報を設定: email=${email ? "***" : "(空)"}`);

    // 基本的なバリデーション
    if (!email || !email.includes("@")) {
      throw new Error("有効なメールアドレスを入力してください");
    }

    if (!password || password.length < 4) {
      throw new Error("パスワードは4文字以上で入力してください");
    }

    const result = setJobcanCredentials(email, password);
    console.log(`Jobcan設定完了: isConfigured=${isJobcanConfigured()}`);
    return {
      ...result,
      isConfigured: isJobcanConfigured(), // 動的に追加
    };
  },

  "config:set-jobcan-url": async (_event: IpcMainInvokeEvent, url: string) => {
    console.log(`JobcanのURLを設定: ${url}`);

    // URLバリデーション
    try {
      new URL(url);
    } catch {
      throw new Error("有効なURLを入力してください");
    }

    setJobcanUrl(url);
    return { url };
  },

  "config:clear-jobcan": async (_event: IpcMainInvokeEvent) => {
    console.log("Jobcan設定をクリア");
    const result = clearJobcanCredentials();
    console.log("Jobcan設定をクリアしました");
    return {
      ...result,
      isConfigured: false, // クリア後は必ずfalse
    };
  },

  "config:test-jobcan": async (_event: IpcMainInvokeEvent) => {
    console.log("Jobcan設定のテスト");

    if (!isJobcanConfigured()) {
      throw new Error("Jobcanの設定が完了していません");
    }

    // TODO: 実際のログインテスト（将来実装）
    console.log("Jobcan設定テスト完了（現在は設定値チェックのみ）");
    return {
      success: true,
      message: "設定値は有効です（実際のログインテストは未実装）",
    };
  },

  // === 一般設定 ===
  "config:set-setting": async (
    _event: IpcMainInvokeEvent,
    key: keyof AppConfig["settings"],
    value: boolean,
  ) => {
    console.log(`設定変更: ${key}=${value}`);
    const currentSettings = getAllConfig().settings;
    const newSettings = { ...currentSettings, [key]: value };

    settingStore.set("settings", newSettings);
    return newSettings;
  },

  // === デバッグ用 ===
  "config:debug-info": async (_event: IpcMainInvokeEvent) => {
    const config = getAllConfig();
    console.log("=== 設定デバッグ情報 ===");
    console.log("Jobcan設定状態:", isJobcanConfigured());
    console.log("設定ファイル場所:", settingStore.path);
    console.log("設定値:", {
      ...config,
      // パスワードをマスク
      jobcan: {
        ...config.jobcan,
        password: config.jobcan.password ? "***" : "",
      },
      slackwf: {
        ...config.slackwf,
        password: config.slackwf.password ? "***" : "",
      },
    });

    return {
      configPath: settingStore.path,
      isJobcanConfigured: isJobcanConfigured(),
      configSize: JSON.stringify(config).length,
    };
  },
};
