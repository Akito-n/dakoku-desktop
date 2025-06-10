import { chromium, type Browser, type Page } from "playwright";

export abstract class PlaywrightBase {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  private isInitialized = false;

  /**
   * ブラウザを起動し、新しいページを作成
   */
  protected async launchBrowser(): Promise<void> {
    if (this.browser) {
      await this.cleanup();
    }

    console.log("🚀 ブラウザを起動中...");

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });

    this.page = await this.browser.newPage();
    this.isInitialized = true;

    console.log("✅ ブラウザ起動完了");
  }

  /**
   * ブラウザリソースのクリーンアップ
   */
  protected async cleanup(): Promise<void> {
    if (!this.browser) return;

    try {
      console.log("🧹 ブラウザをクリーンアップ中...");
      await this.browser.close();
      console.log("✅ クリーンアップ完了");
    } catch (error) {
      console.error("❌ クリーンアップエラー:", error);
    } finally {
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
    }
  }

  /**
   * 型安全なページアクセス
   */
  protected getPage(): Page {
    if (!this.isInitialized || !this.page) {
      throw new Error(
        "ブラウザが初期化されていません。launchBrowser()を先に呼び出してください。",
      );
    }
    return this.page;
  }

  /**
   * 型安全なブラウザアクセス
   */
  protected getBrowser(): Browser {
    if (!this.isInitialized || !this.browser) {
      throw new Error(
        "ブラウザが初期化されていません。launchBrowser()を先に呼び出してください。",
      );
    }
    return this.browser;
  }

  /**
   * ページの待機処理
   */
  protected async waitForTimeout(ms: number): Promise<void> {
    const page = this.getPage();
    await page.waitForTimeout(ms);
  }

  /**
   * 現在のURLを取得
   */
  protected async getCurrentUrl(): Promise<string> {
    const page = this.getPage();
    return page.url();
  }

  /**
   * 指定URLに遷移
   */
  protected async navigateTo(url: string): Promise<void> {
    const page = this.getPage();
    console.log(`🔄 ページ遷移中: ${url}`);
    await page.goto(url);
  }

  /**
   * 各サービスで実装する抽象メソッド
   */
  abstract execute(action: string): Promise<void>;
}
