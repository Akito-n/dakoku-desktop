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
        (finalUrl.includes("app.slack.com") &&
          !finalUrl.includes("accounts.google.com")) ||
        messageInputFound
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

// 勤怠ログボタンをクリックする関数
async function clickAttendanceLogButton(page) {
  try {
    console.log("🔘 勤怠ログボタンを探しています...");

    // 複数のセレクターでボタンを探す
    const buttonSelectors = [
      'button[aria-label="勤怠ログ"]',
      'button[data-qa="composer-workflow-button"]',
      'button:has-text("勤怠ログ")',
      ".workflowBtn__qfczc",
      'button.c-button--primary:has-text("勤怠ログ")',
    ];

    let button = null;
    for (const selector of buttonSelectors) {
      try {
        button = await page.waitForSelector(selector, { timeout: 3000 });
        if (button) {
          console.log(`✅ 勤怠ログボタンを発見: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ セレクタ失敗: ${selector}`);
      }
    }

    if (!button) {
      throw new Error("勤怠ログボタンが見つかりません");
    }

    await button.click();
    console.log("✅ 勤怠ログボタンをクリックしました");

    // モーダル表示を待機
    await page.waitForTimeout(2000);

    return true;
  } catch (error) {
    console.error(`❌ 勤怠ログボタンクリックエラー: ${error.message}`);
    throw error;
  }
}

// WFモーダル内の入力フィールドに値を設定する関数
async function fillAttendanceForm(page, type, date, time, note = "") {
  try {
    console.log(`📝 勤怠フォームに入力中: ${type}, ${date}, ${time}`);

    // 1. 出勤/退勤の選択（コンボボックス）
    const typeSelectors = [
      'input[role="combobox"][aria-label="オプションを選択する"]',
      "input.c-select_input",
      'input[placeholder="オプションを選択する"]',
    ];

    let typeInput = null;
    for (const selector of typeSelectors) {
      try {
        typeInput = await page.waitForSelector(selector, { timeout: 3000 });
        if (typeInput) {
          console.log(`✅ 種別入力フィールドを発見: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 種別セレクタ失敗: ${selector}`);
      }
    }

    if (typeInput) {
      await typeInput.click();
      await typeInput.fill(type); // "出勤" または "退勤"
      await page.waitForTimeout(500);

      // エンターキーでオプションを選択
      await typeInput.press("Enter");
      console.log(`✅ 種別入力完了: ${type}`);
    } else {
      console.log("⚠️ 種別入力フィールドが見つかりません");
    }

    // 2. 出退勤日の入力
    const dateSelectors = [
      'input[placeholder="内容を入力する"][type="text"]',
      ".p-block_kit_plain_text_input_element",
    ];

    let dateInput = null;
    for (const selector of dateSelectors) {
      try {
        const inputs = await page.$$(selector);
        // 最初のテキスト入力フィールドが日付用
        if (inputs.length >= 1) {
          dateInput = inputs[0];
          console.log(`✅ 日付入力フィールドを発見: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 日付セレクタ失敗: ${selector}`);
      }
    }

    if (dateInput) {
      await dateInput.fill(date); // "2025/05/30" 形式
      console.log(`✅ 日付入力完了: ${date}`);
    } else {
      console.log("⚠️ 日付入力フィールドが見つかりません");
    }

    // 3. 時刻の入力
    let timeInput = null;
    for (const selector of dateSelectors) {
      try {
        const inputs = await page.$$(selector);
        // 2番目のテキスト入力フィールドが時刻用
        if (inputs.length >= 2) {
          timeInput = inputs[1];
          console.log(`✅ 時刻入力フィールドを発見: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 時刻セレクタ失敗: ${selector}`);
      }
    }

    if (timeInput) {
      await timeInput.fill(time); // "9:00" 形式
      console.log(`✅ 時刻入力完了: ${time}`);
    } else {
      console.log("⚠️ 時刻入力フィールドが見つかりません");
    }

    // 4. 備考の入力（オプション）
    if (note) {
      try {
        const noteSelectors = [
          '.ql-editor[contenteditable="true"]',
          '[data-qa="block_kit_rich_text_input_element--input"] .ql-editor',
        ];

        let noteInput = null;
        for (const selector of noteSelectors) {
          try {
            noteInput = await page.waitForSelector(selector, { timeout: 3000 });
            if (noteInput) {
              console.log(`✅ 備考入力フィールドを発見: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`❌ 備考セレクタ失敗: ${selector}`);
          }
        }

        if (noteInput) {
          await noteInput.fill(note);
          console.log(`✅ 備考入力完了: ${note}`);
        }
      } catch (error) {
        console.log(`⚠️ 備考入力でエラー: ${error.message}`);
      }
    }

    return true;
  } catch (error) {
    console.error(`❌ フォーム入力エラー: ${error.message}`);
    throw error;
  }
}

// 送信ボタンをクリックする関数
async function submitAttendanceForm(page) {
  try {
    console.log("📤 勤怠フォームを送信中...");

    // console.log("⚠️ 自動送信は現在無効化されています");

    // // 早期リターン - 実際の送信は行わない
    // return true;

    const submitSelectors = [
      'button[data-qa="wizard_modal_next"]',
      'button:has-text("送信する")',
      ".c-wizard_modal__next",
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        submitButton = await page.waitForSelector(selector, { timeout: 3000 });
        if (submitButton) {
          console.log(`✅ 送信ボタンを発見: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ 送信ボタンセレクタ失敗: ${selector}`);
      }
    }

    if (!submitButton) {
      throw new Error("送信ボタンが見つかりません");
    }

    await submitButton.click();
    console.log("✅ 送信ボタンをクリックしました");
    console.log("⏳ 送信完了を待機中...");

    try {
      await page.waitForSelector('[data-qa="wizard_modal"]', {
        state: "hidden",
        timeout: 10000,
      });
      console.log("✅ モーダルが閉じました - 送信成功");
      return { success: true };
    } catch (modalError) {
      // モーダル検知に失敗した場合の代替手段
      console.log("⚠️ モーダル閉鎖の検知に失敗、代替方法で確認中...");

      // 3秒待機してからエラーメッセージの有無を確認
      await page.waitForTimeout(3000);

      // エラーメッセージが表示されていないかチェック
      const hasError = await page
        .locator("text=エラー")
        .or(page.locator("text=失敗"))
        .isVisible()
        .catch(() => false);

      if (!hasError) {
        console.log("✅ エラーメッセージなし - 送信成功と判定");
        return { success: true };
      }
    }
  } catch (error) {
    console.error(`❌ フォーム送信エラー: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 出勤WF処理を実行する関数
async function performStartTimeWorkflow(page, startTime) {
  try {
    console.log("🏢 出勤WF処理を開始します");

    // 現在の日付を取得（yyyy/mm/dd形式）
    const now = new Date();
    const dateString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

    // 勤怠ログボタンをクリック
    await clickAttendanceLogButton(page);

    // フォームに入力
    await fillAttendanceForm(page, "出勤", dateString, startTime);

    // 送信
    await submitAttendanceForm(page);

    console.log("✅ 出勤WF処理が完了しました");
    return true;
  } catch (error) {
    console.error(`❌ 出勤WF処理でエラー: ${error.message}`);
    throw error;
  }
}

// 退勤WF処理を実行する関数
async function performEndTimeWorkflow(page, endTime) {
  try {
    console.log("🏠 退勤WF処理を開始します");

    // 現在の日付を取得（yyyy/mm/dd形式）
    const now = new Date();
    const dateString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

    // 勤怠ログボタンをクリック
    await clickAttendanceLogButton(page);

    // フォームに入力
    await fillAttendanceForm(page, "退勤", dateString, endTime);

    // 送信
    await submitAttendanceForm(page);

    console.log("✅ 退勤WF処理が完了しました");
    return true;
  } catch (error) {
    console.error(`❌ 退勤WF処理でエラー: ${error.message}`);
    throw error;
  }
}

module.exports = {
  signInToWorkspace,
  signInWithGoogle,
  navigateToChannel,
  performStartTimeWorkflow,
  performEndTimeWorkflow,
};
