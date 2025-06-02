const fs = require("node:fs");
const path = require("node:path");

// プロセス管理用のPIDファイル
const PID_FILE = path.join(process.cwd(), "temp", "playwright.pid");

class BrowserManager {
  constructor() {
    this.isClosing = false;
    this.browser = null;
    this.activePage = null;
    this.monitorInterval = null;
  }
  cleanupExistingProcess() {
    if (!fs.existsSync(PID_FILE)) return;

    try {
      const oldPid = fs.readFileSync(PID_FILE, "utf8").trim();
      console.log(`🧹 既存プロセス ${oldPid} をクリーンアップ中...`);

      try {
        process.kill(oldPid, 0); // プロセス存在確認
        process.kill(oldPid, "SIGTERM");
        console.log(`✅ プロセス ${oldPid} を終了しました`);
      } catch (e) {
        console.log(`ℹ️ プロセス ${oldPid} は既に終了済み`);
      }
    } catch (e) {
      console.log(`⚠️ PIDファイル読み取りエラー: ${e.message}`);
    }
  }

  recordCurrentPid() {
    const tempDir = path.dirname(PID_FILE);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(PID_FILE, process.pid.toString());
    console.log(`📝 プロセス ${process.pid} を記録しました`);
  }

  // クリーンアップ処理
  cleanup() {
    if (this.isClosing) return;
    this.isClosing = true;

    try {
      if (this.monitorInterval) {
        clearInterval(this.monitorInterval);
      }

      if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
        console.log("🗑️ PIDファイルを削除しました");
      }
    } catch (e) {
      console.log(`⚠️ クリーンアップエラー: ${e.message}`);
    }
  }

  setupBrowserMonitoring(browser, page) {
    this.browser = browser;
    this.activePage = page;

    page.on("close", () => this.handleBrowserClose("ページが閉じられました"));

    browser.on("disconnected", () =>
      this.handleBrowserClose("ブラウザが切断されました"),
    );

    process.on("SIGINT", () => this.handleBrowserClose("強制終了シグナル受信"));
    process.on("SIGTERM", () => this.handleBrowserClose("終了シグナル受信"));

    this.monitorInterval = setInterval(() => {
      if (page.isClosed() || !browser.isConnected()) {
        this.handleBrowserClose("定期チェックで異常検知");
      }
    }, 10000);

    setTimeout(
      () => {
        this.handleBrowserClose("タイムアウト（15分）");
      },
      15 * 60 * 1000,
    );

    console.log("🔍 ブラウザ監視を開始しました");
    console.log("- ブラウザを閉じると自動終了します");
    console.log("- 15分後に自動終了します");
    console.log("- Ctrl+C で手動終了も可能です");
  }

  async handleBrowserClose(reason) {
    if (this.isClosing) return;
    this.isClosing = true;

    console.log(`🔴 ブラウザクローズ: ${reason}`);

    try {
      if (this.browser?.isConnected()) {
        await this.browser.close();
      }
    } catch (e) {
      console.log(`⚠️ ブラウザクローズエラー: ${e.message}`);
    }

    this.cleanup();
    process.exit(0);
  }

  initialize() {
    this.cleanupExistingProcess();

    return new Promise((resolve) => {
      setTimeout(() => {
        this.recordCurrentPid();
        resolve();
      }, 1000);
    });
  }
}

module.exports = { BrowserManager };
