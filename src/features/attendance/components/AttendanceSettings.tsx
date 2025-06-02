import { useState, useEffect } from "react";
import {
  Card,
  FormGroup,
  InputGroup,
  Button,
  Intent,
  H2,
  Icon,
  Spinner,
} from "@blueprintjs/core";
import { useToast } from "../../common/hooks/useToast";
import {
  useAttendanceConfig,
  useUpdateAttendanceConfig,
} from "../hooks/useAttendanceQuery";

export const AttendanceSettings: React.FC = () => {
  const {
    data: attendanceConfig,
    isLoading: isLoadingConfig,
    error: loadError,
  } = useAttendanceConfig();

  const updateMutation = useUpdateAttendanceConfig();

  const [formData, setFormData] = useState({
    startTime: "09:00",
    endTime: "18:00",
  });

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (attendanceConfig) {
      setFormData({
        startTime: attendanceConfig.startTime,
        endTime: attendanceConfig.endTime,
      });
    }
  }, [attendanceConfig]);

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMutation.mutateAsync(formData);
      showSuccess("勤務時間を保存しました");
    } catch (error) {
      console.error("勤務時間保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "勤務時間の保存に失敗しました",
      );
    }
  };

  if (loadError) {
    return (
      <Card elevation={2} style={{ marginBottom: "20px" }}>
        <div style={{ textAlign: "center", padding: "20px", color: "#cd5c5c" }}>
          <Icon icon="error" size={24} style={{ marginBottom: "10px" }} />
          <div>勤務時間設定の読み込みに失敗しました</div>
          <div style={{ fontSize: "14px", marginTop: "5px" }}>
            {loadError instanceof Error ? loadError.message : "不明なエラー"}
          </div>
        </div>
      </Card>
    );
  }

  if (isLoadingConfig) {
    return (
      <Card elevation={2} style={{ marginBottom: "20px" }}>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spinner size={30} />
          <div style={{ marginTop: "10px" }}>勤務時間設定を読み込み中...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card elevation={2} style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <H2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
          }}
        >
          <Icon icon="time" size={20} />
          勤務時間設定
        </H2>
      </div>

      <form onSubmit={handleSaveAttendance}>
        <div style={{ display: "flex", gap: "20px", alignItems: "end" }}>
          <FormGroup
            label="出勤時刻"
            labelFor="start-time-input"
            helperText="HH:MM形式で入力"
            style={{ flex: 1 }}
          >
            <InputGroup
              id="start-time-input"
              type="time"
              value={formData.startTime}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
              leftIcon="log-in"
              required
            />
          </FormGroup>

          <FormGroup
            label="退勤時刻"
            labelFor="end-time-input"
            helperText="HH:MM形式で入力"
            style={{ flex: 1 }}
          >
            <InputGroup
              id="end-time-input"
              type="time"
              value={formData.endTime}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
              leftIcon="log-out"
              required
            />
          </FormGroup>

          <Button
            type="submit"
            intent={Intent.PRIMARY}
            disabled={updateMutation.isPending}
            icon={
              updateMutation.isPending ? <Spinner size={16} /> : "floppy-disk"
            }
            large
          >
            {updateMutation.isPending ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
