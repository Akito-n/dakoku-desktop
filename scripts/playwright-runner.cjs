// scripts/playwright-runner.js
const { chromium } = require("playwright");

async function openJobcan() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const page = await browser.newPage();
  await page.goto("https://ssl.jobcan.jp/");
  // ブラウザは開いたままにする（ユーザーが手動で閉じる）
}

async function openSlackWF() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  const page = await browser.newPage();
  await page.goto("https://workflowplus.com/");
}

// コマンドライン引数で実行する処理を決定
const action = process.argv[2];
if (action === "jobcan") {
  openJobcan().catch(console.error);
} else if (action === "slackwf") {
  openSlackWF().catch(console.error);
}
