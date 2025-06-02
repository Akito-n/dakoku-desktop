class JobcanNavigation {
  async navigateToAttendance(page) {
    try {
      console.log("🔍 勤怠リンクを探しています...");

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

      await page.waitForTimeout(2000);

      const context = page.context();
      const pages = context.pages();

      if (pages.length > 1) {
        console.log(`✅ 新しいタブが開かれました（総タブ数: ${pages.length}）`);
        const newPage = pages[pages.length - 1];
        await newPage.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 勤怠管理画面に遷移しました");
        return newPage;
      }
      // 同じタブでの遷移の場合。消していいと思う。
      try {
        await page.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 勤怠管理画面に遷移しました");
      } catch (e) {
        console.log("⚠️ ページ遷移の完了を待機中...");
      }
      return page;
    } catch (error) {
      console.error("❌ 勤怠画面への遷移に失敗:", error.message);
      return false;
    }
  }

  async navigateToTimeCorrection(currentPage) {
    try {
      console.log("🔍 打刻修正画面に直接遷移します...");

      // ページが完全に読み込まれるのを待機
      await currentPage.waitForTimeout(2000);

      const timeCorrectionUrl = "https://ssl.jobcan.jp/employee/adit/modify/";

      console.log(`🔄 打刻修正画面に遷移中: ${timeCorrectionUrl}`);
      await currentPage.goto(timeCorrectionUrl);

      // ページ遷移を待機
      try {
        await currentPage.waitForLoadState("networkidle", { timeout: 15000 });
        console.log("✅ 打刻修正画面に遷移しました");
      } catch (e) {
        console.log("⚠️ ページ遷移の完了を待機中...");
      }

      return true;
    } catch (error) {
      console.error("❌ 打刻修正画面への遷移に失敗:", error.message);
      return false;
    }
  }
}

module.exports = { JobcanNavigation };
