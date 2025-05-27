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

module.exports = {
  cleanupExistingProcess,
  recordCurrentPid,
  cleanup,
  setupPageEventListeners,
};
