import { useState } from "react";
import {
  Intent,
  Divider,
  ButtonGroup,
  OverlayToaster,
  type IconName,
} from "@blueprintjs/core";
import { ActionButton } from "../../../components/button";
import type { JobcanActionType, JobcanLoadingState } from "../types/jobcan";
import { JOBCAN_ACTIONS } from "../types/jobcan";

export const JobcanSection: React.FC = () => {
  const [loading, setLoading] = useState<JobcanLoadingState>(null);

  const showToast = (message: string, intent: Intent, icon: IconName) => {
    OverlayToaster.create({ position: "top" }).show({
      message,
      intent,
      icon,
      timeout: intent === Intent.DANGER ? 5000 : 3000,
    });
  };

  const executeJobcanAction = async (actionType: JobcanActionType) => {
    const actionConfig = JOBCAN_ACTIONS[actionType];

    try {
      setLoading(actionConfig.loadingKey);

      await window.electronAPI.jobcan.execute(actionType);

      console.log(`${actionConfig.displayName}完了`);
      showToast(
        `${actionConfig.displayName}を実行しました`,
        Intent.SUCCESS,
        "tick",
      );
    } catch (error) {
      console.error(`${actionConfig.displayName}エラー:`, error);
      showToast(
        error instanceof Error
          ? error.message
          : `${actionConfig.displayName}に失敗しました`,
        Intent.DANGER,
        "error",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleCheckBoth = () => executeJobcanAction("check-both");
  const handleCheckIn = () => executeJobcanAction("check-in");
  const handleCheckOut = () => executeJobcanAction("check-out");

  return (
    <>
      <ButtonGroup vertical style={{ minWidth: "320px" }}>
        <ActionButton
          label="Jobcan 出退勤"
          icon="office"
          intent={Intent.PRIMARY}
          loading={loading === "both"}
          onClick={handleCheckBoth}
          size="large"
          style={{
            height: "65px",
            fontSize: "16px",
            fontWeight: "600",
          }}
        />

        <div style={{ marginTop: "12px" }}>
          <ButtonGroup fill style={{ display: "flex", gap: "2px" }}>
            <ActionButton
              label="出勤"
              icon="log-in"
              intent={Intent.SUCCESS}
              loading={loading === "clock-in"}
              onClick={handleCheckIn}
              style={{
                flex: 1,
                height: "45px",
                fontSize: "14px",
              }}
            />
            <ActionButton
              label="退勤"
              icon="log-out"
              intent={Intent.SUCCESS}
              loading={loading === "clock-out"}
              onClick={handleCheckOut}
              style={{
                flex: 1,
                height: "45px",
                fontSize: "14px",
              }}
            />
          </ButtonGroup>
        </div>
      </ButtonGroup>

      <Divider style={{ margin: "30px 0" }} />
    </>
  );
};
