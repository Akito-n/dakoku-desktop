import {
  getAttendanceConfig,
  getJobcanConfig,
  getJobcanUrl,
} from "../../store/settings";
import { PlaywrightBase } from "../shared/playWrightBase";
import type { ElementHandle } from "playwright";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

export class JobcanService extends PlaywrightBase {
  private static readonly EMAIL_SELECTORS = [
    'input[name="user[email]"]',
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="メール"]',
    'input[placeholder*="mail"]',
    "#email",
    "#user_email",
  ] as const;

  private static readonly PASSWORD_SELECTORS = [
    'input[type="password"]',
    'input[name="password"]',
    'input[name="user[password]"]',
    "#password",
    "#user_password",
  ] as const;

  private static readonly LOGIN_BUTTON_SELECTORS = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button:has-text("ログイン")',
    'button:has-text("サインイン")',
    'input[value*="ログイン"]',
    'input[value*="サインイン"]',
    ".login-button",
    "#login-button",
  ] as const;

  /**
   * Jobcanにログイン
   */
  private async login(): Promise<LoginResult> {
    const credentials = this.getLoginCredentials();

    try {
      console.log("🔐 Jobcanにログイン中...");

      const emailField = await this.findElement(
        JobcanService.EMAIL_SELECTORS,
        "メールアドレス入力フィールド",
      );
      await emailField.fill(credentials.email);

      const passwordField = await this.findElement(
        JobcanService.PASSWORD_SELECTORS,
        "パスワード入力フィールド",
      );
      await passwordField.fill(credentials.password);

      const loginButton = await this.findElement(
        JobcanService.LOGIN_BUTTON_SELECTORS,
        "ログインボタン",
      );
      await loginButton.click();
      await this.waitForLoginComplete();

      return { success: true };
    } catch (error) {
      const message = `ログインに失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`;
      console.error("❌", message);
      return { success: false, message };
    }
  }

  /**
   * 設定から認証情報を取得
   */
  private getLoginCredentials(): LoginCredentials {
    const config = getJobcanConfig();

    if (!config.email || !config.password) {
      throw new Error("Jobcan認証情報が設定されていません");
    }

    return {
      email: config.email,
      password: config.password,
    };
  }

  private async findElement(
    selectors: readonly string[],
    elementName: string,
  ): Promise<ElementHandle> {
    const page = this.getPage();

    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          console.log(`✅ ${elementName}を発見: ${selector}`);
          return element;
        }
      } catch (error) {
        console.log(`❌ セレクタ失敗: ${selector}`);
      }
    }

    throw new Error(`${elementName}が見つかりません`);
  }

  /**
   * ログイン完了を待機
   */
  private async waitForLoginComplete(): Promise<void> {
    try {
      const page = this.getPage();
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch (error) {
      console.log("⚠️ ページ遷移の完了を待機中...");
    }
  }

  /**
   * 勤怠管理画面に遷移
   */
  private async navigateToAttendance(): Promise<void> {
    const page = this.getPage();

    try {
      console.log("勤怠リンクを探しています...");

      await page.waitForTimeout(3000);

      const clickResult = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a"));

        const targetLink = links.find((link) => {
          const isJobcanAttendance =
            link.href === "https://ssl.jobcan.jp/jbcoauth/login";
          const rect = link.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          return isJobcanAttendance && isVisible;
        });

        if (targetLink) {
          targetLink.click();
          return {
            success: true,
            href: targetLink.href,
            text: targetLink.textContent?.trim(),
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

      await page.waitForTimeout(2000);

      const context = page.context();
      const pages = context.pages();

      if (pages.length > 1) {
        console.log(`✅ 新しいタブが開かれました（総タブ数: ${pages.length}）`);
        const newPage = pages[pages.length - 1];
        await newPage.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 勤怠管理画面に遷移しました");

        this.page = newPage;
      } else {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 勤怠管理画面に遷移しました");
      }
    } catch (error) {
      console.error("❌ 勤怠画面への遷移に失敗:", error);
      throw error;
    }
  }

  /**
   * 打刻修正画面に遷移
   */
  private async navigateToTimeCorrection(): Promise<void> {
    const page = this.getPage();

    try {
      console.log("🔍 打刻修正画面に直接遷移します...");

      await page.waitForTimeout(2000);

      const timeCorrectionUrl = "https://ssl.jobcan.jp/employee/adit/modify/";

      console.log(`🔄 打刻修正画面に遷移中: ${timeCorrectionUrl}`);
      await page.goto(timeCorrectionUrl);

      // ページ遷移を待機
      try {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 打刻修正画面に遷移しました");
      } catch (error) {
        console.log("⚠️ ページ遷移の完了を待機中...");
      }
    } catch (error) {
      console.error("❌ 打刻修正画面への遷移に失敗:", error);
      throw error;
    }
  }
  /**
   * 打刻処理を実行
   */
  private async performPunch(action: string, dryRun: boolean): Promise<void> {
    const attendanceConfig = getAttendanceConfig();

    switch (action) {
      case "check-in":
        await this.performStartTimePunch(attendanceConfig.startTime, dryRun);
        break;
      case "check-out":
        await this.performEndTimePunch(attendanceConfig.endTime, dryRun);
        break;
      case "check-both":
        await this.performStartTimePunch(attendanceConfig.startTime, dryRun);
        await this.waitForTimeout(2000);
        await this.performEndTimePunch(attendanceConfig.endTime, dryRun);
        break;
      default:
        throw new Error(`不正なアクション: ${action}`);
    }
  }

  /**
   * 出勤打刻を実行
   */
  private async performStartTimePunch(
    startTime: string,
    dryRun: boolean,
  ): Promise<void> {
    console.log(`🏢 出勤打刻を開始します${dryRun ? " (テストモード)" : ""}`);

    const formattedTime = this.formatTimeForJobcan(startTime);
    const notice = "打刻";

    await this.inputNotice(notice);
    await this.inputStartTime(formattedTime);

    if (dryRun) {
      console.log("🧪 テストモード: 打刻ボタンはクリックしません");
      console.log("✅ 出勤打刻のテスト完了（実際の打刻なし）");
    } else {
      await this.clickPunchButton("出勤");
      console.log("✅ 出勤打刻が完了しました");
    }
  }

  /**
   * 退勤打刻を実行
   */
  private async performEndTimePunch(
    endTime: string,
    dryRun: boolean,
  ): Promise<void> {
    const formattedTime = this.formatTimeForJobcan(endTime);
    const notice = "打刻";

    await this.inputNotice(notice);
    await this.inputEndTime(formattedTime);

    if (dryRun) {
      console.log("🧪 テストモード: 打刻ボタンはクリックしません");
      console.log("✅ 退勤打刻のテスト完了（実際の打刻なし）");
    } else {
      // 実際の打刻実行
      await this.clickPunchButton("退勤");
      console.log("✅ 退勤打刻が完了しました");
    }
  }

  /**
   * 時刻フォーマット変換（HH:MM → HHMM）
   */
  private formatTimeForJobcan(time: string): string {
    return time.replace(":", "");
  }

  /**
   * 備考を入力
   */
  private async inputNotice(notice: string): Promise<void> {
    const page = this.getPage();

    try {
      console.log(`📝 備考を入力中: ${notice}`);

      const noticeTextarea = await page.waitForSelector(
        'textarea[name="notice"]',
        { timeout: 10000 },
      );

      if (!noticeTextarea) {
        throw new Error("備考入力フィールドが見つかりません");
      }

      await noticeTextarea.fill(notice);
      console.log(`✅ 備考入力完了: ${notice}`);
    } catch (error) {
      console.error(`❌ 備考入力エラー: ${error}`);
      throw error;
    }
  }

  /**
   * 出勤時刻を入力
   */
  private async inputStartTime(startTime: string): Promise<void> {
    const page = this.getPage();

    try {
      console.log(`📝 出勤時刻を入力中: ${startTime}`);

      const timeInput = await page.waitForSelector("#ter_time", {
        timeout: 10000,
      });

      if (!timeInput) {
        throw new Error("時刻入力フィールドが見つかりません");
      }

      // フィールドをクリアしてから入力
      await timeInput.click({ clickCount: 3 }); // 全選択
      await timeInput.fill(startTime);

      console.log(`✅ 出勤時刻入力完了: ${startTime}`);
    } catch (error) {
      console.error(`❌ 出勤時刻入力エラー: ${error}`);
      throw error;
    }
  }

  /**
   * 退勤時刻を入力
   */
  private async inputEndTime(endTime: string): Promise<void> {
    const page = this.getPage();

    try {
      console.log(`📝 退勤時刻を入力中: ${endTime}`);

      const timeInput = await page.waitForSelector("#ter_time", {
        timeout: 10000,
      });

      if (!timeInput) {
        throw new Error("時刻入力フィールドが見つかりません");
      }

      // フィールドをクリアしてから入力
      await timeInput.click({ clickCount: 3 }); // 全選択
      await timeInput.fill(endTime);

      console.log(`✅ 退勤時刻入力完了: ${endTime}`);
    } catch (error) {
      console.error(`❌ 退勤時刻入力エラー: ${error}`);
      throw error;
    }
  }

  /**
   * 打刻ボタンをクリック
   */
  private async clickPunchButton(actionType: string): Promise<void> {
    const page = this.getPage();

    try {
      console.log(`🖱️ ${actionType}打刻ボタンをクリック中...`);

      const punchButton = await page.waitForSelector("#insert_button", {
        timeout: 10000,
      });

      if (!punchButton) {
        throw new Error("打刻ボタンが見つかりません");
      }

      // ボタンをクリック
      await punchButton.click();

      // 通信中のラベルが表示されるまで少し待機
      await page.waitForTimeout(1000);

      // 通信完了を待機（通信中ラベルが非表示になるまで）
      try {
        await page.waitForFunction(
          () => {
            const insertLabel = document.getElementById("insert_label");
            return !insertLabel || insertLabel.classList.contains("d-none");
          },
          { timeout: 30000 },
        );
      } catch (e) {
        console.log(
          "⚠️ 通信完了の確認がタイムアウトしましたが、処理を続行します",
        );
      }

      console.log(`✅ ${actionType}打刻完了`);
    } catch (error) {
      console.error(`❌ ${actionType}打刻ボタンクリックエラー: ${error}`);
      throw error;
    }
  }

  async execute(action: string, dryRun = false): Promise<void> {
    try {
      await this.launchBrowser();

      const jobcanUrl = getJobcanUrl();
      await this.navigateTo(jobcanUrl || "https://id.jobcan.jp/users/sign_in");

      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error(loginResult.message || "ログインに失敗しました");
      }

      await this.navigateToAttendance();
      await this.navigateToTimeCorrection();

      await this.performPunch(action, dryRun);
    } finally {
      await this.cleanup();
    }
  }
}
