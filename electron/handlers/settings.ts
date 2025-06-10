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
  getAttendanceConfig,
  setAttendanceConfig,
  isSlackWFConfigured,
  clearSlackWFCredentials,
  setSlackWFTargetChannel,
  setSlackWFUrl,
  setSlackWFCredentials,
  getSlackWFConfig,
  getSlackWFUrl,
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

  // === SlackWF設定 ===
  "config:get-slackwf": async (_event: IpcMainInvokeEvent) => {
    console.log("SlackWF設定を取得");
    const config = getSlackWFConfig();
    const url = getSlackWFUrl();
    return {
      ...config,
      url,
      isConfigured: isSlackWFConfigured(), // 動的に計算
    };
  },

  "config:set-slackwf-credentials": async (
    _event: IpcMainInvokeEvent,
    workspaceName: string,
    googleEmail: string,
    googlePassword: string,
  ) => {
    console.log(
      `SlackWF認証情報を設定: workspace=${workspaceName}, email=${googleEmail ? "***" : "(空)"}`,
    );

    const result = setSlackWFCredentials(
      workspaceName,
      googleEmail,
      googlePassword,
    );
    console.log(`SlackWF設定完了: isConfigured=${isSlackWFConfigured()}`);
    return {
      ...result,
      isConfigured: isSlackWFConfigured(),
    };
  },

  "config:set-slackwf-url": async (_event: IpcMainInvokeEvent, url: string) => {
    console.log(`SlackWFのURLを設定: ${url}`);

    // URLバリデーション
    try {
      new URL(url);
    } catch {
      throw new Error("有効なURLを入力してください");
    }

    setSlackWFUrl(url);
    return { url };
  },

  "config:set-slackwf-channel": async (
    _event: IpcMainInvokeEvent,
    targetChannelUrl: string,
  ) => {
    console.log(`SlackWFのチャンネルURLを設定: ${targetChannelUrl}`);

    if (!targetChannelUrl) {
      throw new Error("チャンネルURLを入力してください");
    }

    const result = setSlackWFTargetChannel(targetChannelUrl);
    return result;
  },

  "config:clear-slackwf": async (_event: IpcMainInvokeEvent) => {
    console.log("SlackWF設定をクリア");
    const result = clearSlackWFCredentials();
    console.log("SlackWF設定をクリアしました");
    return {
      ...result,
      isConfigured: false,
    };
  },

  "config:test-slackwf": async (_event: IpcMainInvokeEvent) => {
    console.log("SlackWF設定のテスト");

    if (!isSlackWFConfigured()) {
      throw new Error("SlackWFの設定が完了していません");
    }

    // TODO: 実際のログインテスト（将来実装）
    console.log("SlackWF設定テスト完了（現在は設定値チェックのみ）");
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

  // === Attendance設定 ===
  "config:get-attendance": async (_event: IpcMainInvokeEvent) => {
    console.log("Attendance設定を取得");
    return getAttendanceConfig();
  },

  "config:set-attendance": async (
    _event: IpcMainInvokeEvent,
    startTime: string,
    endTime: string,
  ) => {
    console.log(`Attendance設定を保存: 出勤=${startTime}, 退勤=${endTime}`);

    // 基本的なバリデーション
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(startTime)) {
      throw new Error("出勤時刻の形式が正しくありません (HH:MM)");
    }

    if (!timeRegex.test(endTime)) {
      throw new Error("退勤時刻の形式が正しくありません (HH:MM)");
    }

    // 出勤時刻が退勤時刻より後でないかチェック
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      throw new Error("出勤時刻は退勤時刻より前である必要があります");
    }

    const result = setAttendanceConfig({ startTime, endTime });
    console.log("Attendance設定完了");
    return result;
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
        password: config.slackwf.googlePassword ? "***" : "",
      },
    });

    return {
      configPath: settingStore.path,
      isJobcanConfigured: isJobcanConfigured(),
      configSize: JSON.stringify(config).length,
    };
  },
};
