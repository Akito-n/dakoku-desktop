// scripts/playwright-runner.cjs
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const { performStartTimePunch, performEndTimePunch } = require("./jobcan.cjs");

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

  // 環境変数から設定を取得
  const jobcanUrl =
    process.env.JOBCAN_URL || "https://id.jobcan.jp/users/sign_in";
  const jobcanEmail = process.env.JOBCAN_EMAIL;
  const jobcanPassword = process.env.JOBCAN_PASSWORD;

  console.log("🔧 Playwright設定確認:");
  console.log(`- URL: ${jobcanUrl}`);
  console.log(`- Email: ${jobcanEmail ? "設定済み" : "未設定"}`);
  console.log(`- Password: ${jobcanPassword ? "設定済み" : "未設定"}`);

  // 認証情報の確認
  if (!jobcanEmail || !jobcanPassword) {
    const error = "認証情報が環境変数から取得できませんでした";
    console.error("❌", error);
    cleanup();
    process.exit(1);
  }

  console.log(`🚀 Jobcan起動中: ${jobcanUrl}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const page = await browser.newPage();

  try {
    // Jobcanページに移動
    console.log("📖 Jobcanページを開いています...");
    await page.goto(jobcanUrl);
    console.log("✅ ページの読み込み完了");

    // ログインフォームの要素を待機
    console.log("🔍 ログインフォームを探しています...");

    try {
      // メールアドレス入力フィールドを探す（複数のセレクタを試行）
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
          console.log(`✅ メールフィールド発見: ${selector}`);
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
          console.log(`✅ パスワードフィールド発見: ${selector}`);
          break;
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (!passwordField) {
        throw new Error("パスワード入力フィールドが見つかりません");
      }

      // ログイン情報を入力
      console.log("📝 認証情報を入力中...");
      await emailField.fill(jobcanEmail);
      await passwordField.fill(jobcanPassword);
      console.log("✅ 認証情報の入力完了");

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
          console.log(`✅ ログインボタン発見: ${selector}`);
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

    // ★ ここから勤怠リンクをクリックして遷移を試行
    try {
      console.log("🔄 勤怠管理画面への遷移を開始...");
      const attendancePage = await navigateToAttendance(page);

      if (attendancePage) {
        console.log("✅ 勤怠管理画面への遷移成功！");

        // ★ 元のタブはそのまま残す（ブラウザが閉じられるのを防ぐ）
        console.log("ℹ️ 元のタブは残したまま、新しいタブで作業を続けます");

        // ★ 勤怠画面遷移成功後、打刻修正画面に遷移（新しいページオブジェクトを使用）
        console.log("🔄 打刻修正画面への遷移を開始...");

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
            console.log("🎉 打刻修正画面への遷移完了！");
            const startTime = process.env.JOBCAN_START_TIME || "0900"; // "0900"
            const endTime = process.env.JOBCAN_END_TIME || "1800"; // "1800"

            try {
              // 出勤打刻の実行
              console.log("🔄 出勤打刻を実行します...");
              await performStartTimePunch(attendancePage, startTime);

              // 出勤と退勤の間に少し待機
              await attendancePage.waitForTimeout(2000);

              // 退勤打刻の実行
              console.log("🔄 退勤打刻を実行します...");
              await performEndTimePunch(attendancePage, endTime);

              console.log("🎉 すべての打刻処理が完了しました！");
            } catch (punchError) {
              console.error("❌ 打刻処理でエラーが発生:", punchError.message);
              console.log("手動で打刻を行ってください");
            }
          } else {
            console.log("⚠️ 打刻修正画面への自動遷移に失敗しました");
            console.log("手動で打刻修正リンクをクリックしてください");
          }
        } catch (timeCorrectionError) {
          console.log(
            "❌ 打刻修正画面への遷移でエラー:",
            timeCorrectionError.message,
          );
          console.log("手動で打刻修正リンクをクリックしてください");
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

    // メインループ（待機）
    await new Promise(() => {}); // 永遠に待つ
  } catch (error) {
    console.error("❌ Jobcan処理でエラーが発生:", error.message);
    await browser.close();
    cleanup();
    throw error;
  }
}

// イベントリスナーの設定を関数として分離
function setupPageEventListeners(browser, activePage) {
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
  activePage.on("close", async () => {
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
      if (activePage.isClosed()) {
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

  console.log("🎉 ブラウザが開きました。");
  console.log("- ブラウザを閉じると自動的にプロセスも終了します");
  console.log("- 30分後に自動終了します");
  console.log("- Ctrl+C で手動終了も可能です");
}

// 勤怠管理画面に遷移する関数（Jobcan専用）
async function navigateToAttendance(page) {
  try {
    console.log("🔍 勤怠リンクを探しています...");

    // まず、少し待機してページが完全に読み込まれるのを待つ
    await page.waitForTimeout(3000);

    // JavaScriptで勤怠リンクを見つけて直接クリック
    const clickResult = await page.evaluate(() => {
      // 全てのaタグを取得
      const links = Array.from(document.querySelectorAll("a"));

      // visible: trueの勤怠リンクを探す
      const targetLink = links.find((link) => {
        const isJobcanAttendance =
          link.href === "https://ssl.jobcan.jp/jbcoauth/login";
        const rect = link.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        return isJobcanAttendance && isVisible;
      });

      if (targetLink) {
        console.log("Found visible attendance link:", targetLink.href);

        // 直接クリック実行
        targetLink.click();
        return {
          success: true,
          href: targetLink.href,
          text: targetLink.textContent.trim(),
        };
      }

      return {
        success: false,
        error: "Visible attendance link not found",
      };
    });

    if (!clickResult.success) {
      throw new Error("表示されている勤怠リンクが見つかりません");
    }

    console.log(`✅ 勤怠リンクをクリックしました: ${clickResult.href}`);
    console.log("⏳ ページ遷移を待機中...");

    // クリック後の処理を待機
    await page.waitForTimeout(2000);

    // 新しいタブ/ウィンドウの処理（target="_blank"の場合）
    const context = page.context();
    const pages = context.pages();

    if (pages.length > 1) {
      console.log(`✅ 新しいタブが開かれました（総タブ数: ${pages.length}）`);
      const newPage = pages[pages.length - 1];
      await newPage.waitForLoadState("networkidle", { timeout: 15000 });
      console.log("✅ 勤怠管理画面に遷移しました");

      // 新しいページを返すように変更して、以降の操作で使用
      return newPage;
    } else {
      // 同じタブでの遷移の場合
      try {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 勤怠管理画面に遷移しました");
      } catch (e) {
        console.log("⚠️ ページ遷移の完了を待機中...");
        // 遷移が完了しなくても成功とみなす
      }
      return page;
    }
  } catch (error) {
    console.error("❌ 勤怠画面への遷移に失敗:", error.message);
    return false;
  }
}

// 打刻修正画面に遷移する関数（直接URLアクセス方式）
async function navigateToTimeCorrection(currentPage) {
  try {
    console.log("🔍 打刻修正画面に直接遷移します...");

    // ページが完全に読み込まれるのを待機
    await currentPage.waitForTimeout(2000);

    // 直接打刻修正のURLに遷移
    const timeCorrectionUrl = "https://ssl.jobcan.jp/employee/adit/modify/";
    // const timeCorrectionUrl =
    //   "https://ssl.jobcan.jp/employee/adit/modify/?year=2025&month=5&day=26";

    console.log(`🔄 打刻修正画面に遷移中: ${timeCorrectionUrl}`);
    await currentPage.goto(timeCorrectionUrl);

    // ページ遷移を待機
    try {
      await currentPage.waitForLoadState("networkidle", { timeout: 15000 });
      console.log("✅ 打刻修正画面に遷移しました");
    } catch (e) {
      console.log("⚠️ ページ遷移の完了を待機中...");
      // 遷移が完了しなくても成功とみなす
    }

    return true;
  } catch (error) {
    console.error("❌ 打刻修正画面への遷移に失敗:", error.message);
    return false;
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
