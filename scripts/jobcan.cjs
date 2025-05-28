// 出勤時刻を入力する関数
async function inputStartTime(page, startTime) {
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

// 退勤時刻を入力する関数
async function inputEndTime(page, endTime) {
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

// 備考を入力する関数
async function inputNotice(page, notice = "システムによる自動打刻") {
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

// 打刻ボタンをクリックする関数
async function clickPunchButton(page, actionType = "出勤") {
  try {
    console.log(`🖱️ ${actionType}打刻ボタンをクリック中...`);

    // 打刻ボタンを取得
    const punchButton = await page.waitForSelector("#insert_button", {
      timeout: 10000,
    });

    if (!punchButton) {
      throw new Error("打刻ボタンが見つかりません");
    }

    // console.log(`🔘 ${actionType}打刻ボタンをクリックします-debug`);
    // return true;

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
      console.log("⚠️ 通信完了の確認がタイムアウトしましたが、処理を続行します");
    }

    console.log(`✅ ${actionType}打刻完了`);
    return true;
  } catch (error) {
    console.error(`❌ ${actionType}打刻ボタンクリックエラー: ${error.message}`);
    throw error;
  }
}

// 出勤打刻を実行する関数
async function performStartTimePunch(page, startTime, notice = "打刻") {
  try {
    console.log("🏢 出勤打刻を開始します");

    // 備考を入力
    await inputNotice(page, notice);

    // 出勤時刻を入力
    await inputStartTime(page, startTime);

    // 少し待機してから打刻ボタンをクリック
    await page.waitForTimeout(1000);

    // 出勤打刻を実行
    await clickPunchButton(page, "出勤");

    console.log("✅ 出勤打刻が完了しました");
    return true;
  } catch (error) {
    console.error(`❌ 出勤打刻でエラー: ${error.message}`);
    throw error;
  }
}

// 退勤打刻を実行する関数
async function performEndTimePunch(page, endTime, notice = "打刻") {
  try {
    console.log("🏠 退勤打刻を開始します");

    // 備考を更新（退勤用に変更）
    await inputNotice(page, notice);

    // 退勤時刻を入力
    await inputEndTime(page, endTime);

    // 少し待機してから打刻ボタンをクリック
    await page.waitForTimeout(1000);

    // 退勤打刻を実行
    await clickPunchButton(page, "退勤");

    console.log("✅ 退勤打刻が完了しました");
    return true;
  } catch (error) {
    console.error(`❌ 退勤打刻でエラー: ${error.message}`);
    throw error;
  }
}

// 勤怠管理画面に遷移する関数（Jobcan専用）
async function navigateToAttendance(page) {
  try {
    console.log("🔍 勤怠リンクを探しています...");

    // まず、少し待機してページが完全に読み込まれるのを待つ
    await page.waitForTimeout(3000);

    // JavaScriptで勤怠リンクを見つけて直接クリック
    const clickResult = await page.evaluate(() => {
      // 全てのaタグを取得
      const links = Array.from(document.querySelectorAll("a"));

      // visible: trueの勤怠リンクを探す
      const targetLink = links.find((link) => {
        const isJobcanAttendance =
          link.href === "https://ssl.jobcan.jp/jbcoauth/login";
        const rect = link.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        return isJobcanAttendance && isVisible;
      });

      if (targetLink) {
        console.log("Found visible attendance link:", targetLink.href);

        // 直接クリック実行
        targetLink.click();
        return {
          success: true,
          href: targetLink.href,
          text: targetLink.textContent.trim(),
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

    console.log(`✅ 勤怠リンクをクリックしました: ${clickResult.href}`);
    console.log("⏳ ページ遷移を待機中...");

    // クリック後の処理を待機
    await page.waitForTimeout(2000);

    // 新しいタブ/ウィンドウの処理（target="_blank"の場合）
    const context = page.context();
    const pages = context.pages();

    if (pages.length > 1) {
      console.log(`✅ 新しいタブが開かれました（総タブ数: ${pages.length}）`);
      const newPage = pages[pages.length - 1];
      await newPage.waitForLoadState("networkidle", { timeout: 15000 });
      console.log("✅ 勤怠管理画面に遷移しました");

      // 新しいページを返すように変更して、以降の操作で使用
      return newPage;
    } else {
      // 同じタブでの遷移の場合
      try {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 勤怠管理画面に遷移しました");
      } catch (e) {
        console.log("⚠️ ページ遷移の完了を待機中...");
        // 遷移が完了しなくても成功とみなす
      }
      return page;
    }
  } catch (error) {
    console.error("❌ 勤怠画面への遷移に失敗:", error.message);
    return false;
  }
}

// 打刻修正画面に遷移する関数（直接URLアクセス方式）
async function navigateToTimeCorrection(currentPage) {
  try {
    console.log("🔍 打刻修正画面に直接遷移します...");

    // ページが完全に読み込まれるのを待機
    await currentPage.waitForTimeout(2000);

    // 直接打刻修正のURLに遷移
    const timeCorrectionUrl = "https://ssl.jobcan.jp/employee/adit/modify/";
    // const timeCorrectionUrl =
    //   "https://ssl.jobcan.jp/employee/adit/modify/?year=2025&month=5&day=26";

    console.log(`🔄 打刻修正画面に遷移中: ${timeCorrectionUrl}`);
    await currentPage.goto(timeCorrectionUrl);

    // ページ遷移を待機
    try {
      await currentPage.waitForLoadState("networkidle", { timeout: 15000 });
      console.log("✅ 打刻修正画面に遷移しました");
    } catch (e) {
      console.log("⚠️ ページ遷移の完了を待機中...");
      // 遷移が完了しなくても成功とみなす
    }

    return true;
  } catch (error) {
    console.error("❌ 打刻修正画面への遷移に失敗:", error.message);
    return false;
  }
}

module.exports = {
  performStartTimePunch,
  performEndTimePunch,
  inputStartTime,
  inputEndTime,
  inputNotice,
  clickPunchButton,
  navigateToAttendance,
  navigateToTimeCorrection,
};
