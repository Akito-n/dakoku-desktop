const { chromium } = require("playwright");
const { BrowserManager } = require("./browser-manager.cjs");

// 各サービスのハンドラーをインポート（後で作成予定）
const { JobcanService } = require("../jobcan/jobcan-service.cjs");
const { SlackWFService } = require("../slackwf/slackwf-service.cjs");
console.log("🔍 playwright-runner.cjs 開始");

try {
  console.log("🔍 BrowserManager をインポート中...");
  const { BrowserManager } = require("./browser-manager.cjs");
  console.log("✅ BrowserManager インポート成功");

  console.log("🔍 JobcanService をインポート中...");
  const { JobcanService } = require("../jobcan/jobcan-service.cjs");
  console.log("✅ JobcanService インポート成功");

  console.log("🔍 SlackWFService をインポート中...");
  const { SlackWFService } = require("../slackwf/slackwf-service.cjs");
  console.log("✅ SlackWFService インポート成功");
} catch (error) {
  console.error("❌ モジュールインポートエラー:", error.message);
  console.error(error.stack);
  process.exit(1);
}

class PlaywrightRunner {
  constructor() {
    this.browserManager = new BrowserManager();
  }

  // Jobcan処理
  async executeJobcan(mode = "both") {
    await this.browserManager.initialize();

    const browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });

    try {
      const jobcanService = new JobcanService(browser);
      const page = await jobcanService.initialize();

      this.browserManager.setupBrowserMonitoring(browser, page);

      // 実際の処理を実行
      await jobcanService.execute(mode);

      await new Promise(() => {});
    } catch (error) {
      console.error("❌ Jobcan処理でエラー:", error.message);
      await browser.close();
      this.browserManager.cleanup();
      throw error;
    }
  }

  // SlackWF処理の実行
  async executeSlackWF(mode = "both") {
    await this.browserManager.initialize();

    const browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });

    try {
      const slackwfService = new SlackWFService(browser);
      const page = await slackwfService.initialize();

      // ブラウザ監視を開始
      this.browserManager.setupBrowserMonitoring(browser, page);

      await slackwfService.execute(mode);

      // メインループ（ブラウザが閉じられるまで待機）
      await new Promise(() => {});
    } catch (error) {
      console.error("❌ SlackWF処理でエラー:", error.message);
      await browser.close();
      this.browserManager.cleanup();
      throw error;
    }
  }
}

// アクションマップ（シンプル化）
const ACTION_MAP = {
  // Jobcan関連
  "jobcan-both": (runner) => runner.executeJobcan("both"),
  "jobcan-start": (runner) => runner.executeJobcan("start"),
  "jobcan-end": (runner) => runner.executeJobcan("end"),

  // SlackWF関連
  "slackwf-both": (runner) => runner.executeSlackWF("both"),
  "slackwf-start": (runner) => runner.executeSlackWF("start"),
  "slackwf-end": (runner) => runner.executeSlackWF("end"),
};

// メイン実行関数
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

  const runner = new PlaywrightRunner();

  try {
    await actionFunction(runner);
  } catch (error) {
    console.error(`❌ ${action} でエラー:`, error.message);
    runner.browserManager.cleanup();
    process.exit(1);
  }
}

// プロセス終了時
process.on("exit", () => {
  const manager = new BrowserManager();
  manager.cleanup();
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  const manager = new BrowserManager();
  manager.cleanup();
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { PlaywrightRunner };
