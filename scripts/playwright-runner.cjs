// scripts/playwright-runner.cjs
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// プロセス管理用のPIDファイル
const PID_FILE = path.join(process.cwd(), "temp", "playwright.pid");

// PIDファイル用ディレクトリ作成
const tempDir = path.dirname(PID_FILE);
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 既存のプロセスをクリーンアップ
function cleanupExistingProcess() {
  if (fs.existsSync(PID_FILE)) {
    try {
      const oldPid = fs.readFileSync(PID_FILE, "utf8").trim();
      console.log(`既存のプロセス ${oldPid} をクリーンアップ中...`);

      // プロセスが生きているかチェック
      try {
        process.kill(oldPid, 0); // シグナル0でプロセス存在確認
        console.log(`既存のプロセス ${oldPid} を終了中...`);
        process.kill(oldPid, "SIGTERM"); // 既存プロセスを終了

        // 少し待ってから強制終了
        setTimeout(() => {
          try {
            process.kill(oldPid, "SIGKILL");
          } catch (e) {
            // プロセスが既に終了している場合は無視
          }
        }, 2000);
      } catch (e) {
        // プロセスが既に存在しない場合は無視
        console.log(`既存のプロセス ${oldPid} は既に終了済み`);
      }
    } catch (e) {
      console.log("PIDファイルの読み取りに失敗:", e.message);
    }
  }
}

// 現在のプロセスPIDを記録
function recordCurrentPid() {
  fs.writeFileSync(PID_FILE, process.pid.toString());
  console.log(`プロセス ${process.pid} を記録しました`);
}

// クリーンアップ処理
function cleanup() {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
      console.log("PIDファイルを削除しました");
    }
  } catch (e) {
    console.log("クリーンアップエラー:", e.message);
  }
}

async function openJobcan() {
  // 既存プロセスのクリーンアップ
  cleanupExistingProcess();

  // 少し待ってから新プロセス開始
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 現在のプロセスを記録
  recordCurrentPid();

  const jobcanUrl =
    process.env.JOBCAN_URL || "https://id.jobcan.jp/users/sign_in";

  console.log(`Opening Jobcan at: ${jobcanUrl}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const page = await browser.newPage();

  try {
    await page.goto(jobcanUrl);
    console.log("Successfully navigated to Jobcan");

    // ★ 複数の終了検知方法を併用
    let isClosing = false;

    // 方法1: browser disconnected
    browser.on("disconnected", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🔴 ブラウザが切断されました (disconnected)");
        cleanup();
        process.exit(0);
      }
    });

    // 方法2: page close
    page.on("close", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🔴 ページが閉じられました (page close)");
        await browser.close();
        cleanup();
        process.exit(0);
      }
    });

    // 方法3: プロセス終了シグナル
    process.on("SIGINT", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🛑 強制終了シグナル受信 (SIGINT)");
        await browser.close();
        cleanup();
        process.exit(0);
      }
    });

    process.on("SIGTERM", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🛑 終了シグナル受信 (SIGTERM)");
        await browser.close();
        cleanup();
        process.exit(0);
      }
    });

    // 方法4: 定期的なブラウザ状態チェック
    const checkInterval = setInterval(async () => {
      try {
        // ブラウザの接続状態を確認
        if (!browser.isConnected()) {
          if (!isClosing) {
            isClosing = true;
            console.log("🔴 ブラウザ接続が失われました (polling check)");
            clearInterval(checkInterval);
            cleanup();
            process.exit(0);
          }
        }

        // ページの状態も確認
        if (page.isClosed()) {
          if (!isClosing) {
            isClosing = true;
            console.log("🔴 ページが閉じられました (polling check)");
            clearInterval(checkInterval);
            await browser.close();
            cleanup();
            process.exit(0);
          }
        }
      } catch (error) {
        // エラーが発生した場合もブラウザが閉じられたと判断
        if (!isClosing) {
          isClosing = true;
          console.log("🔴 ブラウザ状態チェックでエラー:", error.message);
          clearInterval(checkInterval);
          cleanup();
          process.exit(0);
        }
      }
    }, 2000); // 2秒ごとにチェック

    // 方法5: タイムアウト（30分で自動終了）
    const timeout = setTimeout(
      async () => {
        if (!isClosing) {
          isClosing = true;
          console.log("⏰ タイムアウト（30分）によりブラウザを閉じます");
          clearInterval(checkInterval);
          await browser.close();
          cleanup();
          process.exit(0);
        }
      },
      30 * 60 * 1000,
    ); // 30分

    console.log("ブラウザが開きました。");
    console.log("- ブラウザを閉じると自動的にプロセスも終了します");
    console.log("- 30分後に自動終了します");
    console.log("- Ctrl+C で手動終了も可能です");

    // メインループ（待機）
    await new Promise(() => {}); // 永遠に待つ
  } catch (error) {
    console.error("Failed to navigate to Jobcan:", error);
    await browser.close();
    cleanup();
    throw error;
  }
}

async function openSlackWF() {
  // 同様の処理をSlackWF用にも実装
  cleanupExistingProcess();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  recordCurrentPid();

  const slackwfUrl = process.env.SLACKWF_URL || "https://workflowplus.com/";

  console.log(`Opening SlackWF at: ${slackwfUrl}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const page = await browser.newPage();

  try {
    await page.goto(slackwfUrl);
    console.log("Successfully navigated to SlackWF");

    let isClosing = false;

    browser.on("disconnected", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🔴 SlackWFブラウザが切断されました");
        cleanup();
        process.exit(0);
      }
    });

    page.on("close", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🔴 SlackWFページが閉じられました");
        await browser.close();
        cleanup();
        process.exit(0);
      }
    });

    process.on("SIGINT", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🛑 強制終了シグナル受信");
        await browser.close();
        cleanup();
        process.exit(0);
      }
    });

    process.on("SIGTERM", async () => {
      if (!isClosing) {
        isClosing = true;
        console.log("🛑 終了シグナル受信");
        await browser.close();
        cleanup();
        process.exit(0);
      }
    });

    const checkInterval = setInterval(async () => {
      try {
        if (!browser.isConnected() || page.isClosed()) {
          if (!isClosing) {
            isClosing = true;
            console.log("🔴 SlackWFブラウザが閉じられました (polling)");
            clearInterval(checkInterval);
            await browser.close();
            cleanup();
            process.exit(0);
          }
        }
      } catch (error) {
        if (!isClosing) {
          isClosing = true;
          console.log("🔴 SlackWFブラウザ状態チェックでエラー");
          clearInterval(checkInterval);
          cleanup();
          process.exit(0);
        }
      }
    }, 2000);

    const timeout = setTimeout(
      async () => {
        if (!isClosing) {
          isClosing = true;
          console.log("⏰ タイムアウトによりSlackWFブラウザを閉じます");
          clearInterval(checkInterval);
          await browser.close();
          cleanup();
          process.exit(0);
        }
      },
      30 * 60 * 1000,
    );

    console.log("SlackWFブラウザが開きました。");
    console.log("- ブラウザを閉じると自動的にプロセスも終了します");
    console.log("- 30分後に自動終了します");

    await new Promise(() => {});
  } catch (error) {
    console.error("Failed to navigate to SlackWF:", error);
    await browser.close();
    cleanup();
    throw error;
  }
}

// プロセス終了時のクリーンアップを確実に実行
process.on("exit", cleanup);
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  cleanup();
  process.exit(1);
});

// コマンドライン引数で実行する処理を決定
const action = process.argv[2];
if (action === "jobcan") {
  openJobcan().catch((error) => {
    console.error("Jobcan error:", error);
    cleanup();
    process.exit(1);
  });
} else if (action === "slackwf") {
  openSlackWF().catch((error) => {
    console.error("SlackWF error:", error);
    cleanup();
    process.exit(1);
  });
} else {
  console.error("Invalid action. Use 'jobcan' or 'slackwf'");
  process.exit(1);
}
