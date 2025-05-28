// scripts/slack.cjs
// Slack Workflowplus用の自動化機能

// ワークスペースにサインインする関数
async function signInToWorkspace(page, workspaceName) {
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

// scripts/slack.cjs - Google認証のconfirm処理を追加

async function signInWithGoogle(
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
          const emailInput = await page.waitForSelector('input[type="email"]', {
            timeout: 10000,
          });

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
          console.log("⚠️ メールアドレス入力をスキップ（既に入力済みの可能性）");
        }

        // パスワード入力
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

        // === 確認画面の処理 ===
        try {
          console.log("🔍 確認画面またはセキュリティチェックを探しています...");
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

      const newPage = await page.context().newPage();

      // デフォルトのチャンネルURL、または設定されたターゲットURL
      const finalTargetUrl =
        targetChannelUrl ||
        "https://app.slack.com/client/T4Y2T7AMN/C059VF7J8TV";

      await newPage.goto(finalTargetUrl, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      console.log("✅ 新しいタブで目的のSlackチャンネルに遷移完了");

      await page.close();
      console.log("🗂️ 元の認証ページを閉じました");

      await newPage.waitForTimeout(5000);
      console.log("📋 新しいタブのURL:", newPage.url());

      console.log("📋 最終的なページURL:", newPage.url());

      // メッセージ入力欄を複数の方法で確認
      // const messageInputSelectors = [
      //   '[data-qa="message_input"]',
      //   '[data-qa="message-input"]',
      //   '.ql-editor[data-qa="message_input"]',
      //   '[role="textbox"][data-qa*="message"]',
      //   '[contenteditable="true"][data-qa*="message"]',
      // ];

      // let messageInputFound = false;
      // for (const selector of messageInputSelectors) {
      //   const inputExists = await page
      //     .locator(selector)
      //     .isVisible()
      //     .catch(() => false);
      //   if (inputExists) {
      //     console.log(`📝 メッセージ入力欄を発見: ${selector}`);
      //     messageInputFound = true;
      //     break;
      //   }
      // }

      // if (!messageInputFound) {
      //   console.log("❌ メッセージ入力欄が見つかりません");
      //   console.log("🔍 デバッグ: 現在のページ要素を確認");

      //   // ページの主要な要素を確認
      //   const bodyText = await page
      //     .locator("body")
      //     .textContent()
      //     .catch(() => "");
      //   if (
      //     bodyText.includes("ワークスペースが見つかりません") ||
      //     bodyText.includes("アクセスできません")
      //   ) {
      //     console.log("❌ ワークスペースアクセスエラーの可能性");
      //   }

      //   // ページのスクリーンショットを取得してデバッグ
      //   try {
      //     await page.screenshot({
      //       path: "debug-slack-login.png",
      //       fullPage: true,
      //     });
      //     console.log(
      //       "📸 デバッグ用スクリーンショットを保存: debug-slack-login.png",
      //     );
      //   } catch (screenshotError) {
      //     console.log("⚠️ スクリーンショット保存失敗");
      //   }
      // }

      // Slackワークスペースに正常に遷移したかチェック
      const finalUrl = newPage.url();
      if (
        (finalUrl.includes("app.slack.com") &&
          !finalUrl.includes("accounts.google.com")) ||
        messageInputFound
      ) {
        console.log("✅ Slackワークスペースへの遷移成功");
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`❌ Google認証エラー: ${error.message}`);
    throw error;
  }
}

// async function handleSlackAppPopup(page) {
//   try {
//     console.log("🔍 Slackアプリ起動ポップアップをチェック中...");
//     console.log("📋 現在のURL:", page.url());

//     // ダイアログハンドラーを設定（より積極的に）
//     const dialogHandler = async (dialog) => {
//       console.log(`🔔 ダイアログ検出: ${dialog.type()}`);
//       console.log(`📝 ダイアログメッセージ: "${dialog.message()}"`);

//       if (
//         dialog.message().includes("Slack") ||
//         dialog.message().includes("アプリ") ||
//         dialog.message().includes("開く")
//       ) {
//         console.log("🚫 Slackアプリ起動ダイアログを拒否");
//         await dialog.dismiss(); // キャンセルを選択
//       } else {
//         console.log("✅ その他のダイアログを承認");
//         await dialog.accept();
//       }
//     };

//     // ダイアログハンドラーをセット
//     page.on("dialog", dialogHandler);

//     // ポップアップの出現を少し長めに待機
//     await page.waitForTimeout(3000);

//     // ダイアログが出現する可能性のあるアクションを実行
//     console.log("🖱️ ページをクリックしてダイアログを誘発");
//     try {
//       // ページの中央をクリックしてみる
//       await page.mouse.click(400, 300);
//       await page.waitForTimeout(2000);
//     } catch (clickError) {
//       console.log("⚠️ クリック誘発失敗");
//     }

//     // より包括的なポップアップ検出
//     const popupSelectors = [
//       "text=Slack.app を開きますか？",
//       "text=Slack.app を開きますか",
//       "text*=Slack.app を開き",
//       "text*=アプリケーションを開く",
//       '[role="dialog"]',
//       ".modal",
//       "[data-qa*='modal']",
//       "[data-qa*='popup']",
//     ];

//     let popupDetected = false;
//     let detectedSelector = "";

//     for (const selector of popupSelectors) {
//       try {
//         const element = page.locator(selector);
//         if (await element.isVisible()) {
//           popupDetected = true;
//           detectedSelector = selector;
//           console.log(`✅ ポップアップを検出: ${selector}`);
//           break;
//         }
//       } catch (e) {
//         // 次のセレクターを試す
//       }
//     }

//     if (popupDetected) {
//       console.log("🚫 Slackアプリ起動ポップアップを処理します");

//       // キャンセルボタンをより包括的に検出
//       const cancelSelectors = [
//         'button:has-text("キャンセル")',
//         'button[role="button"]:has-text("キャンセル")',
//         "text=キャンセル",
//         '[data-qa*="cancel"]',
//         '[aria-label*="キャンセル"]',
//         ".cancel-button",
//         // 画面左側のボタン（通常キャンセルは左）
//         "button:first-of-type",
//       ];

//       let cancelClicked = false;

//       for (const cancelSelector of cancelSelectors) {
//         try {
//           const cancelButton = page.locator(cancelSelector);

//           if (await cancelButton.isVisible()) {
//             console.log(`🖱️ キャンセルボタンをクリック試行: ${cancelSelector}`);
//             await cancelButton.click();

//             // クリック後、ポップアップが消えるまで待機
//             await page.waitForTimeout(2000);

//             // ポップアップが実際に消えたか確認
//             const stillVisible = await page
//               .locator(detectedSelector)
//               .isVisible()
//               .catch(() => false);
//             if (!stillVisible) {
//               console.log("✅ ポップアップが正常にキャンセルされました");
//               cancelClicked = true;
//               break;
//             } else {
//               console.log("⚠️ ポップアップがまだ表示されています");
//             }
//           }
//         } catch (cancelError) {
//           console.log(
//             `❌ キャンセルボタン ${cancelSelector} でエラー:`,
//             cancelError.message,
//           );
//         }
//       }

//       // キャンセルボタンでうまくいかない場合の代替手段
//       if (!cancelClicked) {
//         console.log("🔧 代替手段を試行中...");

//         // ESCキーを試行
//         console.log("⌨️ ESCキーでポップアップを閉じる試行");
//         await page.keyboard.press("Escape");
//         await page.waitForTimeout(1000);

//         // オーバーレイをクリックして閉じる試行
//         try {
//           console.log("🖱️ オーバーレイクリックを試行");
//           await page.mouse.click(50, 50); // 画面左上をクリック
//           await page.waitForTimeout(1000);
//         } catch (e) {
//           console.log("⚠️ オーバーレイクリック失敗");
//         }

//         // 最終確認
//         const stillVisible = await page
//           .locator(detectedSelector)
//           .isVisible()
//           .catch(() => false);
//         if (!stillVisible) {
//           console.log("✅ 代替手段でポップアップを閉じました");
//           cancelClicked = true;
//         }
//       }

//       if (!cancelClicked) {
//         console.log("❌ ポップアップを閉じることができませんでした");
//         // 強制的に処理を続行
//       }
//     } else {
//       console.log("ℹ️ Slackアプリポップアップは検出されませんでした");

//       // デバッグ：画面に表示されている要素を確認
//       console.log("🔍 デバッグ：現在表示されている要素を確認");
//       const visibleTexts = await page
//         .locator(":visible")
//         .allTextContents()
//         .catch(() => []);
//       const relevantTexts = visibleTexts.filter(
//         (text) =>
//           text.includes("Slack") ||
//           text.includes("キャンセル") ||
//           text.includes("開く") ||
//           text.includes("アプリ"),
//       );
//       console.log("📋 関連するテキスト:", relevantTexts.slice(0, 10));
//     }

//     // ブラウザ版Slackリンクを処理
//     console.log("🌐 ブラウザ版Slackリンクを探しています...");

//     try {
//       // より包括的なブラウザリンク検出
//       const browserLinkSelectors = [
//         '[data-qa="ssb_redirect_open_in_browser"]',
//         'a[href*="aitravel.slack.com"]',
//         "text=ブラウザで Slack を使用する",
//         "text=ブラウザでSlackを使用する",
//         "text*=ブラウザで",
//         "text*=ブラウザ版",
//       ];

//       let linkClicked = false;

//       for (const linkSelector of browserLinkSelectors) {
//         try {
//           const browserLink = page.locator(linkSelector);

//           if (await browserLink.isVisible()) {
//             const href = await browserLink
//               .getAttribute("href")
//               .catch(() => "N/A");
//             console.log(
//               `📋 ブラウザ版リンクを発見: ${linkSelector} -> ${href}`,
//             );

//             // リンククリック前にダイアログハンドラーを再設定
//             page.removeAllListeners("dialog");
//             page.on("dialog", dialogHandler);

//             await browserLink.click();
//             console.log("✅ ブラウザ版リンクをクリックしました");

//             // クリック後、ダイアログ出現の可能性があるので少し待機
//             await page.waitForTimeout(3000);

//             // ページ遷移も待機
//             await page.waitForTimeout(2000);
//             linkClicked = true;
//             break;
//           }
//         } catch (linkError) {
//           console.log(
//             `⚠️ リンク ${linkSelector} の処理でエラー:`,
//             linkError.message,
//           );
//         }
//       }

//       if (!linkClicked) {
//         console.log("❌ ブラウザ版リンクが見つかりません");
//         console.log("🔄 直接ワークスペースURLに遷移します");

//         // 直接遷移前にもダイアログハンドラーを設定
//         page.removeAllListeners("dialog");
//         page.on("dialog", dialogHandler);

//         await page.goto("https://aitravel.slack.com/");
//         await page.waitForTimeout(5000);
//       }
//     } catch (error) {
//       console.log("❌ ブラウザ版リンクの処理でエラー:", error.message);
//     }

//     // 最終状態の確認
//     console.log("📋 処理完了後のURL:", page.url());
//     const pageTitle = await page.title();
//     console.log("📄 ページタイトル:", pageTitle);

//     // メッセージ入力欄の確認
//     const messageInputExists = await page
//       .locator('[data-qa="message_input"]')
//       .isVisible()
//       .catch(() => false);
//     console.log(`📝 メッセージ入力欄の存在: ${messageInputExists}`);

//     // ダイアログハンドラーをクリーンアップ
//     page.removeAllListeners("dialog");

//     return true;
//   } catch (error) {
//     console.error("❌ Slackアプリポップアップ処理エラー:", error.message);
//     // エラー時もダイアログハンドラーをクリーンアップ
//     page.removeAllListeners("dialog");
//     return false;
//   }
// }
// 指定チャンネルに遷移する関数
async function navigateToChannel(page, channelUrl) {
  try {
    if (!channelUrl) {
      console.log("⚠️ チャンネルURLが設定されていません");
      return true; // エラーではなく、手動操作を待つ
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

// 出勤メッセージを送信する関数
async function sendStartWorkMessage(page, startTime) {
  try {
    console.log("🏢 出勤メッセージを送信中...");

    // メッセージ入力フィールドを探す
    const messageInput = await page.waitForSelector(
      '[data-qa="message_input"]',
      {
        timeout: 10000,
      },
    );

    if (!messageInput) {
      throw new Error("メッセージ入力フィールドが見つかりません");
    }

    const message = `おはようございます！\n本日も宜しくお願いします。\n出勤時刻: ${startTime}`;

    await messageInput.fill(message);

    // 送信ボタンをクリック（Enterキーでも可）
    await messageInput.press("Enter");

    console.log("✅ 出勤メッセージ送信完了");
    return true;
  } catch (error) {
    console.error(`❌ 出勤メッセージ送信エラー: ${error.message}`);
    throw error;
  }
}

// 退勤メッセージを送信する関数
async function sendEndWorkMessage(page, endTime) {
  try {
    console.log("🏠 退勤メッセージを送信中...");

    const messageInput = await page.waitForSelector(
      '[data-qa="message_input"]',
      {
        timeout: 10000,
      },
    );

    if (!messageInput) {
      throw new Error("メッセージ入力フィールドが見つかりません");
    }

    const message = "";

    await messageInput.fill(message);
    await messageInput.press("Enter");

    console.log("✅ 退勤メッセージ送信完了");
    return true;
  } catch (error) {
    console.error(`❌ 退勤メッセージ送信エラー: ${error.message}`);
    throw error;
  }
}

module.exports = {
  signInToWorkspace,
  signInWithGoogle,
  navigateToChannel,
  sendStartWorkMessage,
  sendEndWorkMessage,
};
