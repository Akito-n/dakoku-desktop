import { chromium, type Browser, type Page } from "playwright";

export class BrowserController {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });
    this.page = await this.browser.newPage();
  }

  async navigateToJobcan(): Promise<void> {
    if (!this.page) throw new Error("Browser not launched");
    await this.page.goto("https://ssl.jobcan.jp/");
  }

  async navigateToSlackWF(): Promise<void> {
    if (!this.page) throw new Error("Browser not launched");
    await this.page.goto("https://workflowplus.com/");
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
