import {
  getAttendanceConfig,
  getSlackWFConfig,
  getSlackWFUrl,
} from "../../store/settings";
import { PlaywrightBase } from "../shared/playWrightBase";

// ファイル内型定義
interface SlackWFCredentials {
  workspaceName: string;
  googleEmail: string;
  googlePassword: string;
  targetChannelUrl?: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

export class SlackWFService extends PlaywrightBase {
  /**
   * SlackWF認証を実行
   */
  private async authenticate(): Promise<AuthResult> {
    const credentials = this.getSlackWFCredentials();

    try {
      console.log("🔐 SlackWF認証を開始中...");

      // ワークスペースサインイン
      await this.signInToWorkspace(credentials.workspaceName);

      // Google認証
      await this.signInWithGoogle(
        credentials.googleEmail,
        credentials.googlePassword,
      );

      console.log("✅ SlackWF認証完了");
      return { success: true };
    } catch (error) {
      const message = `SlackWF認証に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.error("❌", message);
      return { success: false, message };
    }
  }
  /**
   * 設定からSlackWF認証情報を取得
   */
  private getSlackWFCredentials(): SlackWFCredentials {
    const config = getSlackWFConfig();

    if (
      !config.workspaceName ||
      !config.googleEmail ||
      !config.googlePassword
    ) {
      throw new Error("SlackWF認証情報が設定されていません");
    }

    return {
      workspaceName: config.workspaceName,
      googleEmail: config.googleEmail,
      googlePassword: config.googlePassword,
      targetChannelUrl: config.targetChannelUrl,
    };
  }

  /**
   * ワークスペースにサインイン
   */
  private async signInToWorkspace(workspaceName: string): Promise<void> {
    const page = this.getPage();

    try {
      console.log(`🔍 ワークスペース "${workspaceName}" にサインイン中...`);

      // ワークスペース名を入力
      const workspaceInput = await page.waitForSelector(
        'input[data-qa="signin_domain_input"]',
        { timeout: 10000 },
      );

      if (!workspaceInput) {
        throw new Error("ワークスペース入力フィールドが見つかりません");
      }

      await workspaceInput.fill(workspaceName);

      // 続行ボタンをクリック
      const continueButton = await page.waitForSelector(
        'button[data-qa="submit_team_domain_button"]',
        { timeout: 10000 },
      );

      if (continueButton) {
        await continueButton.click();
        console.log(`✅ ワークスペース "${workspaceName}" への遷移完了`);
      } else {
        throw new Error("続行ボタンが見つかりません");
      }
    } catch (error) {
      console.error(`❌ ワークスペースサインインエラー: ${error}`);
      throw error;
    }
  }

  /**
   * Google認証でサインイン
   */
  private async signInWithGoogle(
    googleEmail: string,
    googlePassword: string,
  ): Promise<void> {
    const page = this.getPage();

    try {
      console.log("🔐 Google認証でサインイン中...");

      // ダイアログ処理の準備
      page.on("dialog", async (dialog) => {
        console.log(`🔔 ダイアログ検出: ${dialog.type()}`);
        console.log(`📝 ダイアログメッセージ: "${dialog.message()}"`);
        await dialog.dismiss();
      });

      // Googleボタンをクリック
      const googleButton = await page.waitForSelector(
        'button:has-text("Google")',
        { timeout: 10000 },
      );

      if (googleButton) {
        console.log("🖱️ Googleサインインボタンをクリック");
        await googleButton.click();

        // Google認証ページに遷移するまで待機
        console.log("⏳ Google認証ページの読み込み待機中...");
        await page.waitForTimeout(5000);

        console.log("📋 認証後のページURL:", page.url());

        // Google認証ページかどうか確認
        const currentUrl = page.url();
        if (currentUrl.includes("accounts.google.com")) {
          await this.handleGoogleAuth(googleEmail, googlePassword);
        } else {
          console.log(
            "ℹ️ すでにGoogle認証済み、またはSlackワークスペースに直接遷移",
          );
        }

        // 最終的にSlackワークスペースに到達（新しいページ作成なし）
        await this.navigateToSlackWorkspace();
      } else {
        throw new Error("Googleサインインボタンが見つかりません");
      }
    } catch (error) {
      console.error(`❌ Google認証エラー: ${error}`);
      throw error;
    }
  }

  /**
   * Google認証の詳細処理
   */
  private async handleGoogleAuth(
    googleEmail: string,
    googlePassword: string,
  ): Promise<void> {
    const page = this.getPage();

    console.log("🔐 Google認証ページを検出、認証情報を入力中...");

    // メールアドレス入力
    try {
      const emailInput = await page.waitForSelector('input[type="email"]', {
        timeout: 10000,
      });
      if (emailInput) {
        await emailInput.fill(googleEmail);
        console.log("📧 メールアドレス入力完了");

        // 次へボタンをクリック
        const nextButton = await page.waitForSelector("#identifierNext", {
          timeout: 5000,
        });
        if (nextButton) {
          await nextButton.click();
          await page.waitForTimeout(3000);
          console.log("➡️ 次のステップに進行");
        }
      }
    } catch (emailError) {
      console.log("⚠️ メールアドレス入力をスキップ（既に入力済みの可能性）");
    }

    // パスワード入力
    try {
      const passwordInput = await page.waitForSelector(
        'input[type="password"]',
        { timeout: 10000 },
      );
      if (passwordInput) {
        await passwordInput.fill(googlePassword);
        console.log("🔒 パスワード入力完了");

        // サインインボタンをクリック
        const signInButton = await page.waitForSelector("#passwordNext", {
          timeout: 5000,
        });
        if (signInButton) {
          await signInButton.click();
          console.log("🔑 Google認証を送信");
          await page.waitForTimeout(5000);
        }
      }
    } catch (passwordError) {
      console.log("⚠️ パスワード入力でエラー:", passwordError);
    }

    // 確認画面の処理
    try {
      const nextButton = await page
        .locator('button:has-text("次へ")')
        .or(page.locator('button:has-text("Continue")'))
        .first();

      if (await nextButton.isVisible()) {
        console.log("✅ 確認ボタンを発見");
        await nextButton.click();
        console.log("🖱️ 確認ボタンをクリック");
        await page.waitForTimeout(3000);
      }
    } catch (confirmError) {
      console.log("ℹ️ 確認画面が見つからない、または不要");
    }
  }

  /**
   * Slackワークスペースに遷移（同一コンテキスト新タブ方式）
   */
  private async navigateToSlackWorkspace(): Promise<void> {
    const credentials = this.getSlackWFCredentials();

    try {
      console.log("🔄 Slackワークスペースに遷移中（ダイアログ回避）...");

      // 固定時間待機を条件ベース待機に変更
      await this.waitForAuthenticationComplete();

      const finalTargetUrl =
        credentials.targetChannelUrl || "https://app.slack.com/";

      console.log(`🎯 目的のSlackチャンネルに遷移: ${finalTargetUrl}`);

      const currentPage = this.getPage();
      console.log("🔍 現在のページURL:", currentPage.url());

      // 現在のコンテキストからCookieを取得してセッション情報を保持
      const context = currentPage.context();
      const cookies = await context.cookies();
      console.log("🍪 セッションCookieを取得:", cookies.length, "個");

      // 新しいコンテキストを作成（ダイアログ回避のため）
      const browser = this.getBrowser();
      const newContext = await browser.newContext();

      // 取得したCookieを新しいコンテキストに設定
      await newContext.addCookies(cookies);
      console.log("🍪 新しいコンテキストにCookieを設定完了");

      // 新しいコンテキストでページを作成
      const newPage = await newContext.newPage();

      // ダイアログ処理を設定
      newPage.on("dialog", async (dialog) => {
        console.log(`🔔 ダイアログ検出: ${dialog.type()}`);
        console.log(`📝 ダイアログメッセージ: "${dialog.message()}"`);
        await dialog.dismiss();
      });

      // 新しいページで目的のURLに遷移
      console.log("🔄 新しいコンテキストで目的のURLに遷移中...");
      await newPage.goto(finalTargetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      console.log("✅ 新しいコンテキストでの遷移完了");

      // 元のページを閉じる
      await currentPage.close();
      console.log("🗂️ 元の認証ページを閉じました");

      // 新しいページに切り替え
      this.page = newPage;

      // ページの読み込み完了を待機（こちらも短縮可能）
      await this.waitForTimeout(3000); // 5秒から3秒に短縮

      console.log("✅ Slackワークスペースへの遷移完了");
      console.log("📋 最終的なページURL:", await this.getCurrentUrl());

      // Slackワークスペースに正常に遷移したかチェック
      const finalUrl = await this.getCurrentUrl();
      if (
        finalUrl.includes("app.slack.com") &&
        !finalUrl.includes("accounts.google.com")
      ) {
        console.log(
          "✅ Slackワークスペースへの遷移成功（ダイアログ回避・セッション維持）",
        );
      } else {
        console.log("⚠️ 予期しないページに遷移:", finalUrl);
      }
    } catch (error) {
      console.error("❌ Slackワークスペース遷移エラー:", error);
      throw error;
    }
  }
  /**
   * 出勤WF処理を実行
   */
  private async performStartTimeWorkflow(
    startTime: string,
    dryRun: boolean,
  ): Promise<void> {
    console.log(`🏢 出勤WF処理を開始します${dryRun ? " (テストモード)" : ""}`);

    // 現在の日付を取得（yyyy/mm/dd形式）
    const now = new Date();
    const dateString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

    // 勤怠ログボタンをクリック
    await this.clickAttendanceLogButton();

    // フォームに入力
    await this.fillAttendanceForm("出勤", dateString, startTime);

    if (dryRun) {
      console.log("🧪 テストモード: ワークフロー送信はしません");
      console.log("✅ 出勤WF処理のテスト完了（実際の送信なし）");
    } else {
      // 送信
      await this.submitAttendanceForm();
      console.log("✅ 出勤WF処理が完了しました");
    }
  }

  /**
   * 退勤WF処理を実行
   */
  private async performEndTimeWorkflow(
    endTime: string,
    dryRun: boolean,
  ): Promise<void> {
    console.log(`🏠 退勤WF処理を開始します${dryRun ? " (テストモード)" : ""}`);

    const now = new Date();
    const dateString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;
    await this.clickAttendanceLogButton();

    await this.fillAttendanceForm("退勤", dateString, endTime);

    if (dryRun) {
      console.log("🧪 テストモード: ワークフロー送信はしません");
      console.log("✅ 退勤WF処理のテスト完了（実際の送信なし）");
    } else {
      await this.submitAttendanceForm();
      console.log("✅ 退勤WF処理が完了しました");
    }
  }

  /**
   * 勤怠ログボタンをクリック
   */
  private async clickAttendanceLogButton(): Promise<void> {
    const page = this.getPage();

    try {
      const buttonSelectors = [
        'button[aria-label="勤怠ログ"]',
        'button[data-qa="composer-workflow-button"]',
        'button:has-text("勤怠ログ")',
        ".workflowBtn__qfczc",
        'button.c-button--primary:has-text("勤怠ログ")',
      ];

      let button = null;
      for (const selector of buttonSelectors) {
        try {
          button = await page.waitForSelector(selector, { timeout: 3000 });
          if (button) {
            console.log(`✅ 勤怠ログボタンを発見: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (!button) {
        throw new Error("勤怠ログボタンが見つかりません");
      }

      await button.click();
      console.log("✅ 勤怠ログボタンをクリックしました");

      // モーダル表示を待機
      await page.waitForTimeout(2000);
    } catch (error) {
      console.error(`❌ 勤怠ログボタンクリックエラー: ${error}`);
      throw error;
    }
  }

  /**
   * 勤怠フォームに入力
   */
  private async fillAttendanceForm(
    type: string,
    date: string,
    time: string,
  ): Promise<void> {
    const page = this.getPage();

    try {
      console.log(`📝 勤怠フォームに入力中: ${type}, ${date}, ${time}`);

      const typeSelectors = [
        'input[role="combobox"][aria-label="オプションを選択する"]',
        "input.c-select_input",
        'input[placeholder="オプションを選択する"]',
      ];

      let typeInput = null;
      for (const selector of typeSelectors) {
        try {
          typeInput = await page.waitForSelector(selector, { timeout: 3000 });
          if (typeInput) {
            console.log(`✅ 種別入力フィールドを発見: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ 種別セレクタ失敗: ${selector}`);
        }
      }

      if (typeInput) {
        await typeInput.click();
        await typeInput.fill(type); // "出勤" または "退勤"
        await page.waitForTimeout(500);
        await typeInput.press("Enter");
        console.log(`✅ 種別入力完了: ${type}`);
      } else {
        console.log("⚠️ 種別入力フィールドが見つかりません");
      }

      // 2. 出退勤日の入力
      const dateSelectors = [
        'input[placeholder="内容を入力する"][type="text"]',
        ".p-block_kit_plain_text_input_element",
      ];

      let dateInput = null;
      for (const selector of dateSelectors) {
        try {
          const inputs = await page.$$(selector);
          if (inputs.length >= 1) {
            dateInput = inputs[0];
            console.log(`✅ 日付入力フィールドを発見: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ 日付セレクタ失敗: ${selector}`);
        }
      }

      if (dateInput) {
        await dateInput.fill(date); // "2025/06/10" 形式
        console.log(`✅ 日付入力完了: ${date}`);
      } else {
        console.log("⚠️ 日付入力フィールドが見つかりません");
      }

      // 3. 時刻の入力
      let timeInput = null;
      for (const selector of dateSelectors) {
        try {
          const inputs = await page.$$(selector);
          if (inputs.length >= 2) {
            timeInput = inputs[1];
            console.log(`✅ 時刻入力フィールドを発見: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ 時刻セレクタ失敗: ${selector}`);
        }
      }

      if (timeInput) {
        await timeInput.fill(time); // "9:00" 形式
        console.log(`✅ 時刻入力完了: ${time}`);
      } else {
        console.log("⚠️ 時刻入力フィールドが見つかりません");
      }
    } catch (error) {
      console.error(`❌ フォーム入力エラー: ${error}`);
      throw error;
    }
  }

  /**
   * 勤怠フォームを送信
   */
  private async submitAttendanceForm(): Promise<void> {
    const page = this.getPage();

    try {
      console.log("📤 勤怠フォームを送信中...");

      const submitSelectors = [
        'button[data-qa="wizard_modal_next"]',
        'button:has-text("送信する")',
        ".c-wizard_modal__next",
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.waitForSelector(selector, {
            timeout: 3000,
          });
          if (submitButton) {
            console.log(`✅ 送信ボタンを発見: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ 送信ボタンセレクタ失敗: ${selector}`);
        }
      }

      if (!submitButton) {
        throw new Error("送信ボタンが見つかりません");
      }

      await submitButton.click();
      console.log("✅ 送信ボタンをクリックしました");
      console.log("⏳ 送信完了を待機中...");

      try {
        await page.waitForSelector('[data-qa="wizard_modal"]', {
          state: "hidden",
          timeout: 10000,
        });
        console.log("✅ モーダルが閉じました - 送信成功");
      } catch (modalError) {
        // モーダル検知に失敗した場合の代替手段
        console.log("⚠️ モーダル閉鎖の検知に失敗、代替方法で確認中...");

        // 3秒待機してからエラーメッセージの有無を確認
        await page.waitForTimeout(3000);

        // エラーメッセージが表示されていないかチェック
        const hasError = await page
          .locator("text=エラー")
          .or(page.locator("text=失敗"))
          .isVisible()
          .catch(() => false);

        if (!hasError) {
          console.log("✅ エラーメッセージなし - 送信成功と判定");
        }
      }
    } catch (error) {
      console.error(`❌ フォーム送信エラー: ${error}`);
      throw error;
    }
  }

  private async performWorkflow(
    action: string,
    dryRun: boolean,
  ): Promise<void> {
    const attendanceConfig = getAttendanceConfig();

    switch (action) {
      case "check-in":
        await this.performStartTimeWorkflow(attendanceConfig.startTime, dryRun);
        break;
      case "check-out":
        await this.performEndTimeWorkflow(attendanceConfig.endTime, dryRun);
        break;
      case "check-both":
        await this.performStartTimeWorkflow(attendanceConfig.startTime, dryRun);
        await this.waitForTimeout(3000);
        await this.performEndTimeWorkflow(attendanceConfig.endTime, dryRun);
        break;
      default:
        throw new Error(`不正なアクション: ${action}`);
    }
  }

  private async waitForAuthenticationComplete(): Promise<void> {
    const currentPage = this.getPage();

    try {
      // リダイレクトページか確認
      await currentPage.waitForFunction(
        () => {
          const url = window.location.href;
          return (
            url.includes("slack.com") && !url.includes("accounts.google.com")
          );
        },
        { timeout: 15000 },
      );
      console.log("✅ 認証完了を確認");
    } catch (e) {
      console.log("⚠️ 認証完了の確認タイムアウト、処理を続行");
    }

    // 追加の安定化待機
    await this.waitForTimeout(2000);
  }

  async execute(action: string, dryRun = false): Promise<void> {
    try {
      await this.launchBrowser();

      // SlackWF URLに遷移
      const slackwfUrl = getSlackWFUrl();
      await this.navigateTo(
        slackwfUrl || "https://slack.com/intl/ja-jp/workspace-signin",
      );

      const authResult = await this.authenticate();
      if (!authResult.success) {
        throw new Error(authResult.message || "認証に失敗しました");
      }

      await this.performWorkflow(action, dryRun);
    } finally {
      await this.cleanup();
    }
  }
}
