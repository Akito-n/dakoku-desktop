export type SlackWFActionType = "check-both" | "check-in" | "check-out";

export interface SlackWFActionConfig {
  type: SlackWFActionType;
  displayName: string;
  description: string;
}

export const SLACKWF_ACTIONS: Record<SlackWFActionType, SlackWFActionConfig> = {
  "check-both": {
    type: "check-both",
    displayName: "出退勤送信",
    description: "出勤・退勤の両方のWFを送信",
  },
  "check-in": {
    type: "check-in",
    displayName: "出勤",
    description: "出勤のWFを送信",
  },
  "check-out": {
    type: "check-out",
    displayName: "退勤",
    description: "退勤のWFを送信",
  },
} as const;
