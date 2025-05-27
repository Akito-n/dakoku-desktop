// scripts/playwright-runner.cjs
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const {
  performStartTimePunch,
  performEndTimePunch,
  navigateToAttendance,
  navigateToTimeCorrection,
} = require("./jobcan.cjs");
const {
  cleanupExistingProcess,
  recordCurrentPid,
  cleanup,
  setupPageEventListeners,
} = require("./process.cjs");

// プロセス管理用のPIDファイル
const PID_FILE = path.join(process.cwd(), "temp", "playwright.pid");

// PIDファイル用ディレクトリ作成
const tempDir = path.dirname(PID_FILE);
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

async function openJobcan() {
  cleanupExistingProcess();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  recordCurrentPid();

  const jobcanUrl =
    process.env.JOBCAN_URL || "https://id.jobcan.jp/users/sign_in";
  const jobcanEmail = process.env.JOBCAN_EMAIL;
  const jobcanPassword = process.env.JOBCAN_PASSWORD;

  // 認証情報の確認
  if (!jobcanEmail || !jobcanPassword) {
    const error = "認証情報が環境変数から取得できませんでした";
    console.error("❌", error);
    cleanup();
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const page = await browser.newPage();

  try {
    await page.goto(jobcanUrl);
    try {
      const emailSelectors = [
        'input[name="user[email]"]',
        'input[type="email"]',
        'input[name="email"]',
        'input[placeholder*="メール"]',
        'input[placeholder*="mail"]',
        "#email",
        "#user_email",
      ];

      let emailField = null;
      for (const selector of emailSelectors) {
        try {
          emailField = await page.waitForSelector(selector, { timeout: 3000 });
          break;
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (!emailField) {
        throw new Error("メールアドレス入力フィールドが見つかりません");
      }

      // パスワード入力フィールドを探す
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[name="user[password]"]',
        "#password",
        "#user_password",
      ];

      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          passwordField = await page.waitForSelector(selector, {
            timeout: 3000,
          });
          break;
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (!passwordField) {
        throw new Error("パスワード入力フィールドが見つかりません");
      }

      // ログイン情報を入力
      await emailField.fill(jobcanEmail);
      await passwordField.fill(jobcanPassword);

      // ログインボタンを探して実行
      const loginSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("ログイン")',
        'button:has-text("サインイン")',
        'input[value*="ログイン"]',
        'input[value*="サインイン"]',
        ".login-button",
        "#login-button",
      ];

      let loginButton = null;
      for (const selector of loginSelectors) {
        try {
          loginButton = await page.waitForSelector(selector, { timeout: 3000 });
          break;
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (loginButton) {
        console.log("🔐 ログインを実行中...");
        await loginButton.click();

        // ログイン後のページ遷移を待機
        try {
          await page.waitForLoadState("networkidle", { timeout: 10000 });
          console.log("✅ ログイン処理完了！");
        } catch (e) {
          console.log("⚠️ ページ遷移の完了を待機中...");
        }
      } else {
        console.log(
          "⚠️ ログインボタンが見つからないため、手動でログインしてください",
        );
      }
    } catch (loginError) {
      console.log("⚠️ 自動ログインに失敗しました:", loginError.message);
      console.log("手動でログインしてください");
    }

    // 勤怠リンクをクリックして遷移を試行
    try {
      const attendancePage = await navigateToAttendance(page);

      if (attendancePage) {
        // ページが有効かチェック
        if (attendancePage.isClosed()) {
          console.log("❌ 勤怠管理画面のページが既に閉じられています");
          throw new Error("勤怠管理画面のページが無効です");
        }

        // 少し待ってからさらに遷移（ページの読み込み完了を待つ）
        await attendancePage.waitForTimeout(3000);

        try {
          const timeCorrectionSuccess =
            await navigateToTimeCorrection(attendancePage);

          if (timeCorrectionSuccess) {
            const startTime = process.env.JOBCAN_START_TIME || "0900";
            const endTime = process.env.JOBCAN_END_TIME || "1800";

            // TODO: 出勤と退勤をタイマーで起動するらなら何かフラグを送ってここで動作させる
            try {
              // 出勤打刻の実行
              console.log("🔄 出勤打刻を実行します...");
              await performStartTimePunch(attendancePage, startTime);

              // 出勤と退勤の間に少し待機
              await attendancePage.waitForTimeout(2000);

              // 退勤打刻の実行
              console.log("🔄 退勤打刻を実行します...");
              await performEndTimePunch(attendancePage, endTime);
            } catch (punchError) {
              console.error("❌ 打刻処理でエラーが発生:", punchError.message);
            }
          } else {
            console.log("⚠️ 打刻修正画面への自動遷移に失敗しました");
          }
        } catch (timeCorrectionError) {
          console.log(
            "❌ 打刻修正画面への遷移でエラー:",
            timeCorrectionError.message,
          );
        }

        // ★ 新しいページオブジェクトに対してイベントリスナーを設定
        setupPageEventListeners(browser, attendancePage);
      } else {
        console.log("⚠️ 勤怠管理画面への遷移に失敗しました");
        console.log("手動で勤怠リンクをクリックしてください");

        // 元のページでイベントリスナーを設定
        setupPageEventListeners(browser, page);
      }
    } catch (attendanceError) {
      console.log("❌ 勤怠画面への遷移でエラー:", attendanceError.message);
      console.log("手動で勤怠リンクをクリックしてください");

      // 元のページでイベントリスナーを設定
      setupPageEventListeners(browser, page);
    }

    // メインループ（待機）自動でプロセスを閉じない
    await new Promise(() => {});
  } catch (error) {
    console.error("❌ Jobcan処理でエラーが発生:", error.message);
    await browser.close();
    cleanup();
    throw error;
  }
}

async function openSlackWF() {
  // 同様の処理をSlackWF用にも実装（将来対応）
  console.log("SlackWF機能は未実装です");
  cleanup();
  process.exit(1);
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
