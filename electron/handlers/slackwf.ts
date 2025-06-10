import { SlackWFService } from "../services/slackwf/slackWFService";
import type { IpcMainInvokeEvent } from "electron";

export const slackwfHandlers = {
  "slackwf:execute": async (
    _event: IpcMainInvokeEvent,
    action: "check-both" | "check-in" | "check-out",
    dryRun = false,
  ) => {
    try {
      const slackwfService = new SlackWFService();
      await slackwfService.execute(action, dryRun);

      const message = dryRun
        ? "SlackWFテスト完了（実際のワークフロー送信なし）"
        : "SlackWFワークフロー送信完了";

      console.log(`✅ 新しいSlackWFサービスのテスト成功: ${message}`);
      return { success: true, message };
    } catch (error) {
      console.error("❌:", error);
    }
  },
};
