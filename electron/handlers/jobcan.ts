import type { IpcMainInvokeEvent } from "electron";
import { JobcanService } from "../services/jobcan/jobcanService";

export const jobcanHandlers = {
  "jobcan:execute": async (
    _event: IpcMainInvokeEvent,
    action: "check-both" | "check-in" | "check-out",
    dryRun = false,
  ) => {
    try {
      const jobcanService = new JobcanService();
      await jobcanService.execute(action, dryRun);

      return {
        success: true,
        message: dryRun ? "認証テスト完了" : "打刻処理完了",
      };
    } catch (error) {
      console.error("❌:", error);
    }
  },
};
