// scripts/jobcan/jobcan-service.cjs
const { JobcanAuth } = require("./jobcan-auth.cjs");
const { JobcanActions } = require("./jobcan-actions.cjs");
const { JobcanNavigation } = require("./jobcan-navigation.cjs");

class JobcanService {
  constructor(browser) {
    this.browser = browser;
    this.page = null;
    this.auth = new JobcanAuth();
    this.actions = new JobcanActions();
    this.navigation = new JobcanNavigation();
  }

  async initialize() {
    console.log("🚀 Jobcan サービスを初期化中...");

    this.page = await this.browser.newPage();
    const jobcanUrl =
      process.env.JOBCAN_URL || "https://id.jobcan.jp/users/sign_in";

    // 認証情報の確認
    const email = process.env.JOBCAN_EMAIL;
    const password = process.env.JOBCAN_PASSWORD;

    if (!email || !password) {
      throw new Error("認証情報が環境変数から取得できませんでした");
    }

    // Jobcanにアクセス
    await this.page.goto(jobcanUrl);

    // ログイン実行
    await this.auth.login(this.page, email, password);

    // 勤怠管理画面に遷移
    const attendancePage = await this.navigation.navigateToAttendance(
      this.page,
    );
    if (attendancePage) {
      this.page = attendancePage;
    }

    // 打刻修正画面に遷移
    await this.navigation.navigateToTimeCorrection(this.page);

    console.log("✅ Jobcan サービス初期化完了");
    return this.page;
  }

  async execute(mode) {
    const startTime = process.env.JOBCAN_START_TIME || "0900";
    const endTime = process.env.JOBCAN_END_TIME || "1800";

    console.log(`🔄 Jobcan処理開始: ${mode}`);

    switch (mode) {
      case "start":
        await this.actions.performStartTimePunch(this.page, startTime);
        break;
      case "end":
        await this.actions.performEndTimePunch(this.page, endTime);
        break;
      case "both":
        await this.actions.performStartTimePunch(this.page, startTime);
        await this.page.waitForTimeout(2000);
        await this.actions.performEndTimePunch(this.page, endTime);
        break;
      default:
        throw new Error(`不正なモード: ${mode}`);
    }

    console.log(`✅ Jobcan処理完了: ${mode}`);
  }
}

module.exports = { JobcanService };
