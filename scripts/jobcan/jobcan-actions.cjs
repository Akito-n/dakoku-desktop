// scripts/jobcan/jobcan-actions.cjs

class JobcanActions {
  // 出勤時刻を入力する関数（既存のコードをそのまま移動）
  async inputStartTime(page, startTime) {
    try {
      console.log(`📝 出勤時刻を入力中: ${startTime}`);

      // 時刻入力フィールドを取得
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
      return true;
    } catch (error) {
      console.error(`❌ 出勤時刻入力エラー: ${error.message}`);
      throw error;
    }
  }

  // 退勤時刻を入力する関数（既存のコードをそのまま移動）
  async inputEndTime(page, endTime) {
    try {
      console.log(`📝 退勤時刻を入力中: ${endTime}`);

      // 時刻入力フィールドを取得
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
      return true;
    } catch (error) {
      console.error(`❌ 退勤時刻入力エラー: ${error.message}`);
      throw error;
    }
  }

  // 備考を入力する関数（既存のコードをそのまま移動）
  async inputNotice(page, notice = "システムによる自動打刻") {
    try {
      console.log(`📝 備考を入力中: ${notice}`);

      // 備考入力フィールドを取得
      const noticeTextarea = await page.waitForSelector(
        'textarea[name="notice"]',
        { timeout: 10000 },
      );

      if (!noticeTextarea) {
        throw new Error("備考入力フィールドが見つかりません");
      }

      await noticeTextarea.fill(notice);

      console.log(`✅ 備考入力完了: ${notice}`);
      return true;
    } catch (error) {
      console.error(`❌ 備考入力エラー: ${error.message}`);
      throw error;
    }
  }

  // 打刻ボタンをクリックする関数（既存のコードをそのまま移動）
  async clickPunchButton(page, actionType = "出勤") {
    try {
      console.log(`🖱️ ${actionType}打刻ボタンをクリック中...`);

      // 打刻ボタンを取得
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
      return true;
    } catch (error) {
      console.error(
        `❌ ${actionType}打刻ボタンクリックエラー: ${error.message}`,
      );
      throw error;
    }
  }

  // 出勤打刻を実行する関数（既存のコードをそのまま移動）
  async performStartTimePunch(page, startTime, notice = "打刻") {
    try {
      console.log("🏢 出勤打刻を開始します");

      // 備考を入力
      await this.inputNotice(page, notice);

      // 出勤時刻を入力
      await this.inputStartTime(page, startTime);

      // 少し待機してから打刻ボタンをクリック
      await page.waitForTimeout(1000);

      // 出勤打刻を実行
      await this.clickPunchButton(page, "出勤");

      console.log("✅ 出勤打刻が完了しました");
      return true;
    } catch (error) {
      console.error(`❌ 出勤打刻でエラー: ${error.message}`);
      throw error;
    }
  }

  // 退勤打刻を実行する関数（既存のコードをそのまま移動）
  async performEndTimePunch(page, endTime, notice = "打刻") {
    try {
      console.log("🏠 退勤打刻を開始します");

      // 備考を更新（退勤用に変更）
      await this.inputNotice(page, notice);

      // 退勤時刻を入力
      await this.inputEndTime(page, endTime);

      // 少し待機してから打刻ボタンをクリック
      await page.waitForTimeout(1000);

      // 退勤打刻を実行
      await this.clickPunchButton(page, "退勤");

      console.log("✅ 退勤打刻が完了しました");
      return true;
    } catch (error) {
      console.error(`❌ 退勤打刻でエラー: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { JobcanActions };
