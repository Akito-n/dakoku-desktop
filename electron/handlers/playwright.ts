import { spawn } from "node:child_process";
import path from "node:path";
import {
  getJobcanUrl,
  getJobcanConfig,
  getAttendanceConfig,
  formatTimeForJobcan,
} from "../store/settings";

export const playwrightHandlers = {
  "playwright:open-jobcan": async () => {
    console.log("=== 詳細デバッグモード開始 ===");

    // electron-storeから設定を取得
    const jobcanUrl = getJobcanUrl();
    const attendanceConfig = getAttendanceConfig();
    const startTime = Date.now();

    const jobcanConfig = getJobcanConfig();

    console.log("🔧 設定情報:");
    console.log(`  - URL: ${jobcanUrl}`);
    console.log(`  - Email: ${jobcanConfig.email ? "設定済み" : "未設定"}`);
    console.log(
      `  - Password: ${jobcanConfig.password ? "設定済み" : "未設定"}`,
    );

    // 認証情報のバリデーション
    if (!jobcanConfig.email || !jobcanConfig.password) {
      const missingFields = [];
      if (!jobcanConfig.email) missingFields.push("メールアドレス");
      if (!jobcanConfig.password) missingFields.push("パスワード");

      const errorMessage = `認証情報が不足しています: ${missingFields.join(", ")}`;
      console.error("❌", errorMessage);
      throw new Error(errorMessage);
    }

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        process.cwd(),
        "scripts",
        "core",
        "playwright-runner.cjs",
      );

      // 環境変数で認証情報を子プロセスに渡す
      const child = spawn("node", [scriptPath, "jobcan"], {
        stdio: "inherit",
        env: {
          ...process.env,
          JOBCAN_URL: jobcanUrl,
          JOBCAN_EMAIL: jobcanConfig.email,
          JOBCAN_PASSWORD: jobcanConfig.password,
          JOBCAN_START_TIME: formatTimeForJobcan(attendanceConfig.startTime), // "0900"
          JOBCAN_END_TIME: formatTimeForJobcan(attendanceConfig.endTime),
          EXIT_METHOD: "graceful", // immediate, graceful, natural を切り替え可能
        },
      });

      // すべてのイベントに詳細ログを追加
      child.on("spawn", () => {
        const elapsed = Date.now() - startTime;
        console.log(`✅ SPAWN: ${elapsed}ms - プロセス ${child.pid} 起動成功`);
      });

      child.on("exit", (code, signal) => {
        const elapsed = Date.now() - startTime;
        console.log(`🔴 EXIT: ${elapsed}ms - プロセス ${child.pid} 終了`);
        console.log(`  - exitCode: ${code}`);
        console.log(`  - signal: ${signal}`);
        console.log(`  - killed: ${child.killed}`);
        console.log(`  - connected: ${child.connected}`);

        if (code === 0) {
          console.log("✅ EXIT イベントで正常終了を検知");
          resolve(undefined);
        } else {
          console.log(`❌ EXIT イベントで異常終了を検知: code=${code}`);
          reject(new Error(`Process exited with code ${code}`));
        }
      });

      child.on("close", (code, signal) => {
        const elapsed = Date.now() - startTime;
        console.log(
          `🔵 CLOSE: ${elapsed}ms - プロセス ${child.pid} ストリーム閉鎖`,
        );
        console.log(`  - exitCode: ${code}`);
        console.log(`  - signal: ${signal}`);

        // exit イベントが発火しなかった場合のフォールバック
        if (!child.exitCode && code === 0) {
          console.log("⚠️  EXIT イベントが発火しなかったため、CLOSE で処理");
          resolve(undefined);
        }
      });

      child.on("error", (error) => {
        const elapsed = Date.now() - startTime;
        console.log(`❌ ERROR: ${elapsed}ms - プロセス起動エラー`);
        console.log(`  - error: ${error.message}`);
        reject(error);
      });

      child.on("disconnect", () => {
        const elapsed = Date.now() - startTime;
        console.log(`🔌 DISCONNECT: ${elapsed}ms - IPC切断`);
      });

      // プロセスの詳細情報を定期的にログ出力
      const monitorInterval = setInterval(() => {
        if (child.exitCode === null) {
          console.log(`📊 プロセス監視: PID ${child.pid} 実行中...`);
        } else {
          clearInterval(monitorInterval);
        }
      }, 5000);
    });
  },

  "playwright:open-slackwf": async () => {
    // SlackWF版も同様に実装（将来対応）
    console.log("SlackWF機能は未実装です");
    throw new Error("SlackWF機能は未実装です");
  },
};
