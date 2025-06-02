class SlackNavigation {
  async navigateToChannel(page, channelUrl) {
    try {
      if (!channelUrl) {
        console.log("⚠️ チャンネルURLが設定されていません");
        return true;
      }

      console.log(`🔄 指定チャンネルに遷移中: ${channelUrl}`);
      await page.goto(channelUrl);

      // ページ遷移を待機
      await page.waitForLoadState("networkidle", { timeout: 15000 });
      console.log("✅ チャンネル遷移完了");
      return true;
    } catch (error) {
      console.error(`❌ チャンネル遷移エラー: ${error.message}`);
      return false;
    }
  }
}

module.exports = { SlackNavigation };
