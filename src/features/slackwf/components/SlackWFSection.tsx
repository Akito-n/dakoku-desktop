import { useState } from "react";
import {
  Intent,
  Divider,
  ButtonGroup,
  OverlayToaster,
  type IconName,
} from "@blueprintjs/core";
import { ActionButton } from "../../../components/button";
import type { SlackWFActionType } from "../types/slackWf";
import { SLACKWF_ACTIONS } from "../types/slackWf";

export const SlackWFSection: React.FC = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const showToast = (message: string, intent: Intent, icon: IconName) => {
    OverlayToaster.create({ position: "bottom" }).show({
      message,
      intent,
      icon,
      timeout: intent === Intent.DANGER ? 5000 : 3000,
    });
  };

  const executeSlackWFAction = async (
    actionType: SlackWFActionType,
    loadingKey: string,
  ) => {
    const actionConfig = SLACKWF_ACTIONS[actionType];

    try {
      setLoading(loadingKey);

      await window.electronAPI.slackwf.execute(actionType);

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

  const handleExecuteBoth = () =>
    executeSlackWFAction("check-both", "slackwf-both");
  const handleExecuteCheckIn = () =>
    executeSlackWFAction("check-in", "slackwf-in");
  const handleExecuteCheckOut = () =>
    executeSlackWFAction("check-out", "slackwf-out");

  return (
    <>
      <ButtonGroup vertical style={{ minWidth: "320px" }}>
        <ActionButton
          label="SlackWF 出退勤"
          icon="chat"
          intent={Intent.NONE}
          loading={loading === "slackwf-both"}
          onClick={handleExecuteBoth}
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
              intent={Intent.PRIMARY}
              loading={loading === "slackwf-in"}
              onClick={handleExecuteCheckIn}
              style={{
                flex: 1,
                height: "45px",
                fontSize: "14px",
              }}
            />
            <ActionButton
              label="退勤"
              icon="log-out"
              intent={Intent.PRIMARY}
              loading={loading === "slackwf-out"}
              onClick={handleExecuteCheckOut}
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
