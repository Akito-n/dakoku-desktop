class JobcanAuth {
  async login(page, email, password) {
    try {
      console.log("🔐 Jobcanにログイン中...");

      const emailSelectors = [
        'input[name="user[email]"]',
        'input[type="email"]',
        'input[name="email"]',
        'input[placeholder*="メール"]',
        'input[placeholder*="mail"]',
        "#email",
        "#user_email",
      ];

      let emailField = null;
      for (const selector of emailSelectors) {
        try {
          emailField = await page.waitForSelector(selector, { timeout: 3000 });
          break;
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (!emailField) {
        throw new Error("メールアドレス入力フィールドが見つかりません");
      }

      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[name="user[password]"]',
        "#password",
        "#user_password",
      ];

      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          passwordField = await page.waitForSelector(selector, {
            timeout: 3000,
          });
          break;
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (!passwordField) {
        throw new Error("パスワード入力フィールドが見つかりません");
      }

      await emailField.fill(email);
      await passwordField.fill(password);

      const loginSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("ログイン")',
        'button:has-text("サインイン")',
        'input[value*="ログイン"]',
        'input[value*="サインイン"]',
        ".login-button",
        "#login-button",
      ];

      let loginButton = null;
      for (const selector of loginSelectors) {
        try {
          loginButton = await page.waitForSelector(selector, { timeout: 3000 });
          break;
        } catch (e) {
          console.log(`❌ セレクタ失敗: ${selector}`);
        }
      }

      if (loginButton) {
        console.log("🔐 ログインを実行中...");
        await loginButton.click();

        try {
          await page.waitForLoadState("networkidle", { timeout: 10000 });
          console.log("✅ ログイン処理完了！");
        } catch (e) {
          console.log("⚠️ ページ遷移の完了を待機中...");
        }
      } else {
        console.log(
          "⚠️ ログインボタンが見つからないため、手動でログインしてください",
        );
      }

      return true;
    } catch (error) {
      console.log("⚠️ 自動ログインに失敗しました:", error.message);
      console.log("手動でログインしてください");
      return false;
    }
  }
}

module.exports = { JobcanAuth };
