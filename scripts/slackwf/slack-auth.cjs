class SlackAuth {
  // ワークスペースにサインインする関数（既存のコードをそのまま移動）
  async signInToWorkspace(page, workspaceName) {
    try {
      console.log(`🔍 ワークスペース "${workspaceName}" にサインイン中...`);

      // ワークスペース名を入力
      const workspaceInput = await page.waitForSelector(
        'input[data-qa="signin_domain_input"]',
        {
          timeout: 10000,
        },
      );

      if (!workspaceInput) {
        throw new Error("ワークスペース入力フィールドが見つかりません");
      }

      await workspaceInput.fill(workspaceName);

      // 続行ボタンをクリック
      const continueButton = await page.waitForSelector(
        'button[data-qa="submit_team_domain_button"]',
        {
          timeout: 10000,
        },
      );

      if (continueButton) {
        await continueButton.click();
        console.log(`✅ ワークスペース "${workspaceName}" への遷移完了`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`❌ ワークスペースサインインエラー: ${error.message}`);
      throw error;
    }
  }

  async signInWithGoogle(
    page,
    googleEmail,
    googlePassword,
    targetChannelUrl = null,
  ) {
    try {
      console.log("🔐 Google認証でサインイン中...");

      page.on("dialog", async (dialog) => {
        console.log(`🔔 ダイアログ検出: ${dialog.type()}`);
        console.log(`📝 ダイアログメッセージ: "${dialog.message()}"`);
      });

      // Googleボタンをクリック
      const googleButton = await page.waitForSelector(
        'button:has-text("Google")',
        {
          timeout: 10000,
        },
      );

      if (googleButton) {
        console.log("🖱️ Googleサインインボタンをクリック");
        await googleButton.click();

        // Google認証ページに遷移するまで待機
        console.log("⏳ Google認証ページの読み込み待機中...");
        await page.waitForTimeout(5000);

        console.log("📋 認証後のページURL:", page.url());

        // Google認証ページかどうか確認
        const currentUrl = page.url();
        if (currentUrl.includes("accounts.google.com")) {
          console.log("🔐 Google認証ページを検出、認証情報を入力中...");

          // メールアドレス入力
          try {
            const emailInput = await page.waitForSelector(
              'input[type="email"]',
              {
                timeout: 10000,
              },
            );

            if (emailInput) {
              await emailInput.fill(googleEmail);
              console.log("📧 メールアドレス入力完了");

              // 次へボタンをクリック
              const nextButton = await page.waitForSelector("#identifierNext", {
                timeout: 5000,
              });

              if (nextButton) {
                await nextButton.click();
                await page.waitForTimeout(3000);
                console.log("➡️ 次のステップに進行");
              }
            }
          } catch (emailError) {
            console.log(
              "⚠️ メールアドレス入力をスキップ（既に入力済みの可能性）",
            );
          }

          try {
            const passwordInput = await page.waitForSelector(
              'input[type="password"]',
              {
                timeout: 10000,
              },
            );

            if (passwordInput) {
              await passwordInput.fill(googlePassword);
              console.log("🔒 パスワード入力完了");

              // サインインボタンをクリック
              const signInButton = await page.waitForSelector("#passwordNext", {
                timeout: 5000,
              });

              if (signInButton) {
                await signInButton.click();
                console.log("🔑 Google認証を送信");

                // 認証完了を待機
                await page.waitForTimeout(5000);
                console.log("✅ Google認証送信完了");
              }
            }
          } catch (passwordError) {
            console.log("⚠️ パスワード入力でエラー:", passwordError.message);
          }

          try {
            console.log(
              "🔍 確認画面またはセキュリティチェックを探しています...",
            );
            page.on("dialog", async (dialog) => {
              console.log(`🔔 ダイアログ検出: ${dialog.type()}`);
              console.log(`📝 ダイアログメッセージ: "${dialog.message()}"`);
              await dialog.dismiss(); // ダイアログを閉じる
            });

            // 「次へ」ボタンを探してクリック
            const nextButton = await page
              .locator('button:has-text("次へ")')
              .or(page.locator('button:has-text("Continue")'))
              .first();

            if (await nextButton.isVisible()) {
              console.log("✅ 確認ボタンを発見");
              await nextButton.click();
              console.log("🖱️ 確認ボタンをクリック");
              await page.waitForTimeout(3000);
            } else {
              console.log("ℹ️ 確認ボタンが見つからない、または不要");
            }

            // エラーチェック
            const hasError = await page
              .locator("text=問題が発生しました")
              .or(page.locator("text=エラーが発生しました"))
              .isVisible();

            if (hasError) {
              console.log("❌ Google認証エラー検出");
              throw new Error("Google認証でエラーが発生しました");
            }
          } catch (confirmError) {
            console.log("⚠️ 確認画面処理でエラー:", confirmError.message);
            throw confirmError;
          }
        } else {
          console.log(
            "ℹ️ すでにGoogle認証済み、またはSlackワークスペースに直接遷移",
          );
        }

        // Google認証完了後、直接目的のSlackチャンネルに遷移
        const context = page.context();
        const newPage = await context.newPage();

        // デフォルトのチャンネルURL、または設定されたターゲットURL
        const finalTargetUrl =
          targetChannelUrl ||
          "https://app.slack.com/client/T4Y2T7AMN/C059VF7J8TV";

        await newPage.goto(finalTargetUrl, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });

        console.log("✅ 新しいタブで目的のSlackチャンネルに遷移完了");

        await page.close();
        console.log("🗂️ 元の認証ページを閉じました");

        await newPage.waitForTimeout(5000);
        console.log("📋 新しいタブのURL:", newPage.url());

        console.log("📋 最終的なページURL:", newPage.url());

        // Slackワークスペースに正常に遷移したかチェック
        const finalUrl = newPage.url();
        if (
          finalUrl.includes("app.slack.com") &&
          !finalUrl.includes("accounts.google.com")
        ) {
          console.log("✅ Slackワークスペースへの遷移成功");
          return newPage;
        }
      }

      return newPage;
    } catch (error) {
      console.error(`❌ Google認証エラー: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { SlackAuth };
