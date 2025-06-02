const { SlackAuth } = require("./slack-auth.cjs");
const { SlackWorkflow } = require("./slack-workflow.cjs");
const { SlackNavigation } = require("./slack-navigation.cjs");

class SlackWFService {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
    this.auth = new SlackAuth();
    this.workflow = new SlackWorkflow();
    this.navigation = new SlackNavigation();
  }

  async initialize() {
    console.log("🚀 SlackWF サービスを初期化中...");

    const slackwfUrl =
      process.env.SLACKWF_URL ||
      "https://slack.com/intl/ja-jp/workspace-signin";
    const workspaceName = process.env.SLACKWF_WORKSPACE;
    const googleEmail = process.env.SLACKWF_GOOGLE_EMAIL;
    const googlePassword = process.env.SLACKWF_GOOGLE_PASSWORD;
    const channelUrl = process.env.SLACKWF_CHANNEL_URL;

    // 認証情報の確認
    if (!workspaceName || !googleEmail || !googlePassword) {
      throw new Error("SlackWF認証情報が環境変数から取得できませんでした");
    }

    const context = await this.browser.newContext();
    this.page = await context.newPage();

    // ダイアログ処理
    this.page.on("dialog", async (dialog) => {
      console.log(`ダイアログタイプ: ${dialog.type()}`);
      console.log(`メッセージ: ${dialog.message()}`);
      await dialog.dismiss();
    });

    // SlackWFのワークスペースサインインページに移動
    await this.page.goto(slackwfUrl);

    // ワークスペースにサインイン
    await this.auth.signInToWorkspace(this.page, workspaceName);

    // 少し待機してからGoogle認証
    await this.page.waitForTimeout(2000);

    // Google認証でサインイン
    const slackPage = await this.auth.signInWithGoogle(
      this.page,
      googleEmail,
      googlePassword,
    );

    if (!slackPage) {
      throw new Error("Slack認証に失敗しました");
    }

    this.page = slackPage;

    // Slack画面の読み込み完了を待機
    await this.page.waitForTimeout(5000);

    // 指定チャンネルに遷移（設定されている場合）
    if (channelUrl) {
      await this.navigation.navigateToChannel(this.page, channelUrl);
    }

    console.log("✅ SlackWF サービス初期化完了");
    return this.page;
  }

  async execute(mode) {
    const startTime = process.env.SLACKWF_START_TIME || "09:00";
    const endTime = process.env.SLACKWF_END_TIME || "18:00";

    console.log(`🔄 SlackWF処理開始: ${mode}`);

    switch (mode) {
      case "start":
        console.log("🏢 出勤WF処理のみ実行");
        await this.workflow.performStartTimeWorkflow(this.page, startTime);
        break;
      case "end":
        console.log("🏠 退勤WF処理のみ実行");
        await this.workflow.performEndTimeWorkflow(this.page, endTime);
        break;
      case "both":
        console.log("🏢🏠 出勤・退勤WF処理を実行");
        await this.workflow.performStartTimeWorkflow(this.page, startTime);
        await this.page.waitForTimeout(3000);
        await this.workflow.performEndTimeWorkflow(this.page, endTime);
        break;
      default:
        throw new Error(`不正なモード: ${mode}`);
    }

    console.log(`✅ SlackWF処理完了: ${mode}`);
  }
}

module.exports = { SlackWFService };
