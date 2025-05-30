// scripts/playwright-runner.cjs
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

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

const {
  signInToWorkspace,
  signInWithGoogle,
  navigateToChannel,
  performStartTimeWorkflow,
  performEndTimeWorkflow,
} = require("./slack.cjs");

// プロセス管理用のPIDファイル
const PID_FILE = path.join(process.cwd(), "temp", "playwright.pid");

// PIDファイル用ディレクトリ作成
const tempDir = path.dirname(PID_FILE);
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

async function openJobcan(mode = "both") {
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

            await executeJobcanAction(attendancePage, mode, startTime, endTime);
            // try {
            //   // 出勤打刻の実行
            //   console.log("🔄 出勤打刻を実行します...");
            //   await performStartTimePunch(attendancePage, startTime);

            //   // 出勤と退勤の間に少し待機
            //   await attendancePage.waitForTimeout(2000);

            //   // 退勤打刻の実行
            //   console.log("🔄 退勤打刻を実行します...");
            //   await performEndTimePunch(attendancePage, endTime);
            // } catch (punchError) {
            //   console.error("❌ 打刻処理でエラーが発生:", punchError.message);
            // }
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

async function openSlackWF(mode = "both") {
  cleanupExistingProcess();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  recordCurrentPid();

  const slackwfUrl =
    process.env.SLACKWF_URL || "https://slack.com/intl/ja-jp/workspace-signin";
  const workspaceName = process.env.SLACKWF_WORKSPACE;
  const googleEmail = process.env.SLACKWF_GOOGLE_EMAIL;
  const googlePassword = process.env.SLACKWF_GOOGLE_PASSWORD;
  const channelUrl = process.env.SLACKWF_CHANNEL_URL;

  // 認証情報の確認
  if (!workspaceName || !googleEmail || !googlePassword) {
    const error = "SlackWF認証情報が環境変数から取得できませんでした";
    console.error("❌", error);
    cleanup();
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("dialog", async (dialog) => {
    console.log(`ダイアログタイプ: ${dialog.type()}`);
    console.log(`メッセージ: ${dialog.message()}`);
    await dialog.dismiss();
  });
  // const page = await browser.newPage();

  try {
    // SlackWFのワークスペースサインインページに移動
    await page.goto(slackwfUrl);

    // ワークスペースにサインイン
    await signInToWorkspace(page, workspaceName);

    // 少し待機してからGoogle認証
    await page.waitForTimeout(2000);

    // Google認証でサインイン
    const slackPage = await signInWithGoogle(page, googleEmail, googlePassword);

    if (!slackPage) {
      throw new Error("Slack認証に失敗しました");
    }

    // Slack画面の読み込み完了を待機
    await slackPage.waitForTimeout(5000);

    // 指定チャンネルに遷移（設定されている場合）
    if (channelUrl) {
      await navigateToChannel(slackPage, channelUrl);
    }

    // 出勤・退勤メッセージの処理
    const startTime = process.env.SLACKWF_START_TIME || "09:00";
    const endTime = process.env.SLACKWF_END_TIME || "18:00";

    console.log("ここまできた");

    await executeSlackWFAction(slackPage, mode, startTime, endTime);

    // ページイベントリスナーを設定
    setupPageEventListeners(browser, slackPage);

    // メインループ（待機）
    await new Promise(() => {});
  } catch (error) {
    console.error("❌ SlackWF処理でエラーが発生:", error.message);
    await browser.close();
    cleanup();
    throw error;
  }
}

async function executeSlackWFAction(page, mode, startTime, endTime) {
  console.log(`🔄 SlackWF処理開始: ${mode}`);

  try {
    switch (mode) {
      case "start":
        console.log("🏢 出勤WF処理のみ実行");
        await performStartTimeWorkflow(page, startTime);
        break;

      case "end":
        console.log("🏠 退勤WF処理のみ実行");
        await performEndTimeWorkflow(page, endTime);
        break;

      case "both":
        console.log("🏢🏠 出勤・退勤WF処理を実行");
        await performStartTimeWorkflow(page, startTime);

        // 出勤処理完了後、少し待機してから退勤処理
        await page.waitForTimeout(3000);

        await performEndTimeWorkflow(page, endTime);
        break;
    }

    console.log(`✅ SlackWF処理完了: ${mode}`);
  } catch (error) {
    console.error(`❌ SlackWF処理エラー (${mode}):`, error.message);
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

async function executeJobcanAction(page, mode, startTime, endTime) {
  console.log(`🔄 打刻処理開始: ${mode}`);

  try {
    switch (mode) {
      case "start":
        console.log("🏢 出勤打刻のみ実行");
        await performStartTimePunch(page, startTime);
        break;

      case "end":
        console.log("🏠 退勤打刻のみ実行");
        await performEndTimePunch(page, endTime);
        break;

      case "both":
        console.log("🏢🏠 出勤・退勤打刻を実行");
        await performStartTimePunch(page, startTime);
        await page.waitForTimeout(2000);
        await performEndTimePunch(page, endTime);
        break;
    }

    console.log(`✅ 打刻処理完了: ${mode}`);
  } catch (error) {
    console.error(`❌ 打刻処理エラー (${mode}):`, error.message);
    throw error;
  }
}

const ACTION_MAP = {
  // Jobcan関連
  "jobcan-both": () => openJobcan("both"), // 出勤・退勤両方
  "jobcan-start": () => openJobcan("start"), // 出勤のみ
  "jobcan-end": () => openJobcan("end"), // 退勤のみ

  "slackwf-both": () => openSlackWF("both"),
  "slackwf-start": () => openSlackWF("start"),
  "slackwf-end": () => openSlackWF("end"),
};

async function main() {
  const action = process.argv[2];

  if (!action) {
    console.error("❌ アクションが指定されていません");
    console.log("使用可能なアクション:", Object.keys(ACTION_MAP).join(", "));
    process.exit(1);
  }

  const actionFunction = ACTION_MAP[action];

  if (!actionFunction) {
    console.error(`❌ 不正なアクション: ${action}`);
    console.log("使用可能なアクション:", Object.keys(ACTION_MAP).join(", "));
    process.exit(1);
  }

  try {
    await actionFunction();
  } catch (error) {
    console.error(`❌ ${action} でエラー:`, error.message);
    cleanup();
    process.exit(1);
  }
}

main();
