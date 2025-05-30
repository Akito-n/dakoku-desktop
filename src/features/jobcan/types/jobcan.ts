export type JobcanActionType = "check-both" | "check-in" | "check-out";

export type JobcanLoadingState = "both" | "clock-in" | "clock-out" | null;

export interface JobcanActionConfig {
  type: JobcanActionType;
  loadingKey: Exclude<JobcanLoadingState, null>;
  displayName: string;
}

export const JOBCAN_ACTIONS: Record<JobcanActionType, JobcanActionConfig> = {
  "check-both": {
    type: "check-both",
    loadingKey: "both",
    displayName: "出退勤打刻",
  },
  "check-in": {
    type: "check-in",
    loadingKey: "clock-in",
    displayName: "出勤打刻",
  },
  "check-out": {
    type: "check-out",
    loadingKey: "clock-out",
    displayName: "退勤打刻",
  },
} as const;
