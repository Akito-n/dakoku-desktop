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
import { useToast } from "../../../features/common/hooks/useToast";

export const AttendanceSettings: React.FC = () => {
  const [attendanceConfig, setAttendanceConfig] = useState({
    startTime: "09:00",
    endTime: "18:00",
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  // 初期データ読み込み
  useEffect(() => {
    const loadAttendanceConfig = async () => {
      try {
        const config = await window.electronAPI.config.getAttendance();
        setAttendanceConfig(config);
      } catch (error) {
        console.error("勤務時間設定の読み込みに失敗:", error);
        showError("勤務時間設定の読み込みに失敗しました");
      }
    };

    loadAttendanceConfig();
  }, [showError]);

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await window.electronAPI.config.setAttendance(
        attendanceConfig.startTime,
        attendanceConfig.endTime,
      );

      setAttendanceConfig(result);
      showSuccess("勤務時間を保存しました");
    } catch (error) {
      console.error("勤務時間保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "勤務時間の保存に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

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
              value={attendanceConfig.startTime}
              onChange={(e) =>
                setAttendanceConfig((prev) => ({
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
              value={attendanceConfig.endTime}
              onChange={(e) =>
                setAttendanceConfig((prev) => ({
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
            disabled={loading}
            icon={loading ? <Spinner size={16} /> : "floppy-disk"}
            large
          >
            {loading ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
