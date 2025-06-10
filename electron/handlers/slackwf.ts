import { spawn } from "node:child_process";
import path from "node:path";
import {
  getSlackWFUrl,
  getSlackWFConfig,
  getAttendanceConfig,
  formatTimeForSlackWF,
} from "../store/settings";
// 新しいサービスのインポートを追加
import { SlackWFService } from "../services/slackwf/slackWFService";
import type { IpcMainInvokeEvent } from "electron";

export const slackwfHandlers = {
  "slackwf:execute": async (
    _event: IpcMainInvokeEvent,
    action: "check-both" | "check-in" | "check-out",
    dryRun = false,
  ) => {
    console.log(`🧪 新しいSlackWFServiceをテスト中... (dryRun: ${dryRun})`);

    try {
      // 新しいサービスでテスト実行
      const slackwfService = new SlackWFService();
      await slackwfService.execute(action, dryRun);

      const message = dryRun
        ? "SlackWFテスト完了（実際のワークフロー送信なし）"
        : "SlackWFワークフロー送信完了";

      console.log(`✅ 新しいSlackWFサービスのテスト成功: ${message}`);
      return { success: true, message };
    } catch (error) {
      console.error("❌ 新しいSlackWFサービスのテスト失敗:", error);

      // フォールバック：既存の処理に戻す
      console.log("🔄 既存の処理にフォールバック...");
      return await executeOriginalSlackWF(_event, action);
    }
  },
};

// 既存の処理をフォールバック用に分離
async function executeOriginalSlackWF(
  _event: IpcMainInvokeEvent,
  action: "check-both" | "check-in" | "check-out",
) {
  const slackwfUrl = getSlackWFUrl();
  const attendanceConfig = getAttendanceConfig();
  const startTime = Date.now();

  const slackwfConfig = getSlackWFConfig();

  if (
    !slackwfConfig.workspaceName ||
    !slackwfConfig.googleEmail ||
    !slackwfConfig.googlePassword
  ) {
    const missingFields = [];
    if (!slackwfConfig.workspaceName) missingFields.push("ワークスペース名");
    if (!slackwfConfig.googleEmail) missingFields.push("Googleメールアドレス");
    if (!slackwfConfig.googlePassword) missingFields.push("Googleパスワード");

    const errorMessage = `SlackWF認証情報が不足しています: ${missingFields.join(", ")}`;
    console.error("❌", errorMessage);
    throw new Error(errorMessage);
  }

  const actionMap = {
    "check-both": "slackwf-both",
    "check-in": "slackwf-start",
    "check-out": "slackwf-end",
  };
  const subcommand = actionMap[action];

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "core",
      "playwright-runner.cjs",
    );

    const child = spawn("node", [scriptPath, subcommand], {
      stdio: "inherit",
      env: {
        ...process.env,
        SLACKWF_URL: slackwfUrl,
        SLACKWF_WORKSPACE: slackwfConfig.workspaceName,
        SLACKWF_GOOGLE_EMAIL: slackwfConfig.googleEmail,
        SLACKWF_GOOGLE_PASSWORD: slackwfConfig.googlePassword,
        SLACKWF_CHANNEL_URL: slackwfConfig.targetChannelUrl || "",
        SLACKWF_START_TIME: formatTimeForSlackWF(attendanceConfig.startTime),
        SLACKWF_END_TIME: formatTimeForSlackWF(attendanceConfig.endTime),
        EXIT_METHOD: "graceful",
      },
    });

    child.on("spawn", () => {
      const elapsed = Date.now() - startTime;
      console.log(
        `✅ SPAWN: ${elapsed}ms - SlackWFプロセス ${child.pid} 起動成功`,
      );
    });

    child.on("exit", (code, signal) => {
      const elapsed = Date.now() - startTime;
      console.log(`🔴 EXIT: ${elapsed}ms - SlackWFプロセス ${child.pid} 終了`);
      console.log(`  - exitCode: ${code}`);
      console.log(`  - signal: ${signal}`);

      if (code === 0) {
        console.log("✅ SlackWF EXIT イベントで正常終了を検知");
        resolve(undefined);
      } else {
        console.log(`❌ SlackWF EXIT イベントで異常終了を検知: code=${code}`);
        reject(new Error(`SlackWF Process exited with code ${code}`));
      }
    });

    child.on("close", (code, signal) => {
      const elapsed = Date.now() - startTime;
      console.log(
        `🔵 CLOSE: ${elapsed}ms - SlackWFプロセス ${child.pid} ストリーム閉鎖`,
      );
      console.log(`  - exitCode: ${code}`);
      console.log(`  - signal: ${signal}`);

      if (!child.exitCode && code === 0) {
        console.log(
          "⚠️ SlackWF EXIT イベントが発火しなかったため、CLOSE で処理",
        );
        resolve(undefined);
      }
    });

    child.on("error", (error) => {
      const elapsed = Date.now() - startTime;
      console.log(`❌ ERROR: ${elapsed}ms - SlackWFプロセス起動エラー`);
      console.log(`  - error: ${error.message}`);
      reject(error);
    });

    child.on("disconnect", () => {
      const elapsed = Date.now() - startTime;
      console.log(`🔌 DISCONNECT: ${elapsed}ms - IPC切断`);
    });

    const monitorInterval = setInterval(() => {
      if (child.exitCode === null) {
        console.log(`📊 プロセス監視: PID ${child.pid} 実行中...`);
      } else {
        clearInterval(monitorInterval);
      }
    }, 5000);
  });
}
