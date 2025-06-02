class SlackWorkflow {
  async sendStartWorkMessage(page, startTime) {
    try {
      console.log("🏢 出勤メッセージを送信中...");

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

      await messageInput.press("Enter");

      console.log("✅ 出勤メッセージ送信完了");
      return true;
    } catch (error) {
      console.error(`❌ 出勤メッセージ送信エラー: ${error.message}`);
      throw error;
    }
  }

  async sendEndWorkMessage(page, endTime) {
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

  async clickAttendanceLogButton(page) {
    try {
      console.log("🔘 勤怠ログボタンを探しています...");

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

  async fillAttendanceForm(page, type, date, time, note = "") {
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

      // 4. 備考の入力（オプション）。基本触らない
      if (note) {
        try {
          const noteSelectors = [
            '.ql-editor[contenteditable="true"]',
            '[data-qa="block_kit_rich_text_input_element--input"] .ql-editor',
          ];

          let noteInput = null;
          for (const selector of noteSelectors) {
            try {
              noteInput = await page.waitForSelector(selector, {
                timeout: 3000,
              });
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
  async submitAttendanceForm(page) {
    try {
      console.log("📤 勤怠フォームを送信中...");

      const submitSelectors = [
        'button[data-qa="wizard_modal_next"]',
        'button:has-text("送信する")',
        ".c-wizard_modal__next",
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = await page.waitForSelector(selector, {
            timeout: 3000,
          });
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
  async performStartTimeWorkflow(page, startTime) {
    try {
      console.log("🏢 出勤WF処理を開始します");

      // 現在の日付を取得（yyyy/mm/dd形式）
      const now = new Date();
      const dateString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

      // 勤怠ログボタンをクリック
      await this.clickAttendanceLogButton(page);

      // フォームに入力
      await this.fillAttendanceForm(page, "出勤", dateString, startTime);

      // 送信
      await this.submitAttendanceForm(page);

      console.log("✅ 出勤WF処理が完了しました");
      return true;
    } catch (error) {
      console.error(`❌ 出勤WF処理でエラー: ${error.message}`);
      throw error;
    }
  }

  // 退勤WF処理を実行する関数
  async performEndTimeWorkflow(page, endTime) {
    try {
      console.log("🏠 退勤WF処理を開始します");

      // 現在の日付を取得（yyyy/mm/dd形式）
      const now = new Date();
      const dateString = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")}`;

      // 勤怠ログボタンをクリック
      await this.clickAttendanceLogButton(page);

      // フォームに入力
      await this.fillAttendanceForm(page, "退勤", dateString, endTime);

      // 送信
      await this.submitAttendanceForm(page);

      console.log("✅ 退勤WF処理が完了しました");
      return true;
    } catch (error) {
      console.error(`❌ 退勤WF処理でエラー: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { SlackWorkflow };
