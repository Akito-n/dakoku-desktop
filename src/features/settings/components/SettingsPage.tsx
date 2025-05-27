import type React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  FormGroup,
  InputGroup,
  Button,
  Intent,
  Callout,
  H2,
  H1,
  Tag,
  ButtonGroup,
  Divider,
  Icon,
  Spinner,
  type IconName,
} from "@blueprintjs/core";

interface JobcanConfig {
  email: string;
  password: string;
  url: string;
  isConfigured: boolean;
}

const SettingsPage: React.FC = () => {
  const [jobcanConfig, setJobcanConfig] = useState<JobcanConfig>({
    email: "",
    password: "",
    url: "",
    isConfigured: false,
  });
  const [attendanceConfig, setAttendanceConfig] = useState({
    startTime: "09:00",
    endTime: "18:00",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    intent: Intent;
    text: string;
    icon: IconName;
  } | null>(null);

  const loadAllSettings = useCallback(async () => {
    try {
      // Jobcan設定読み込み
      const jobcanConfig = await window.electronAPI.config.getJobcan();
      setJobcanConfig(jobcanConfig);

      // Attendance設定読み込み
      const attendanceConfig = await window.electronAPI.config.getAttendance();
      setAttendanceConfig(attendanceConfig);
    } catch (error) {
      console.error("設定の読み込みに失敗:", error);
      setMessage({
        intent: Intent.DANGER,
        text: "設定の読み込みに失敗しました",
        icon: "error",
      });
    }
  }, []);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.config.setJobcanCredentials(
        jobcanConfig.email,
        jobcanConfig.password,
      );

      setJobcanConfig((prev) => ({ ...prev, ...result }));
      setMessage({
        intent: Intent.SUCCESS,
        text: "Jobcan認証情報を保存しました",
        icon: "tick",
      });
    } catch (error) {
      console.error("保存エラー:", error);
      setMessage({
        intent: Intent.DANGER,
        text: error instanceof Error ? error.message : "保存に失敗しました",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await window.electronAPI.config.setJobcanUrl(jobcanConfig.url);
      setMessage({
        intent: Intent.SUCCESS,
        text: "JobcanのURLを保存しました",
        icon: "tick",
      });
    } catch (error) {
      console.error("URL保存エラー:", error);
      setMessage({
        intent: Intent.DANGER,
        text: error instanceof Error ? error.message : "URL保存に失敗しました",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfig = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.config.clearJobcan();
      setJobcanConfig((prev) => ({ ...prev, ...result, isConfigured: false }));
      setMessage({
        intent: Intent.WARNING,
        text: "Jobcanの設定をクリアしました",
        icon: "info-sign",
      });
    } catch (error) {
      console.error("クリアエラー:", error);
      setMessage({
        intent: Intent.DANGER,
        text: "クリアに失敗しました",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConfig = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.config.testJobcan();
      setMessage({
        intent: Intent.SUCCESS,
        text: result.message,
        icon: "tick",
      });
    } catch (error) {
      console.error("テストエラー:", error);
      setMessage({
        intent: Intent.DANGER,
        text: error instanceof Error ? error.message : "テストに失敗しました",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.config.setAttendance(
        attendanceConfig.startTime,
        attendanceConfig.endTime,
      );

      setAttendanceConfig(result);
      setMessage({
        intent: Intent.SUCCESS,
        text: "勤務時間を保存しました",
        icon: "tick",
      });
    } catch (error) {
      console.error("勤務時間保存エラー:", error);
      setMessage({
        intent: Intent.DANGER,
        text: error instanceof Error ? error.message : "保存に失敗しました",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
        }}
      >
        <H1
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            margin: 0,
          }}
        >
          <Icon icon="cog" size={24} />
          設定管理
        </H1>
      </div>

      {message && (
        <Callout
          intent={message.intent}
          icon={message.icon}
          style={{ marginBottom: "20px" }}
        >
          {message.text}
        </Callout>
      )}

      <Card elevation={2} style={{ marginTop: "20px", marginBottom: "20px" }}>
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

      {/* Jobcan設定カード */}
      <Card elevation={2}>
        {/* Jobcan設定ヘッダー - 修正版 */}
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
            <Icon icon="office" size={20} />
            Jobcan 設定
          </H2>
          <Tag
            intent={jobcanConfig.isConfigured ? Intent.SUCCESS : Intent.NONE}
            icon={jobcanConfig.isConfigured ? "tick" : "cross"}
            large
          />
        </div>

        {/* URL設定 */}
        <FormGroup
          label="Jobcan URL"
          helperText="JobcanのログインページURLを指定してください"
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <InputGroup
              value={jobcanConfig.url}
              onChange={(e) =>
                setJobcanConfig((prev) => ({ ...prev, url: e.target.value }))
              }
              placeholder="https://id.jobcan.jp/users/sign_in"
              leftIcon="link"
              style={{ flexGrow: 1 }}
            />
            <Button
              intent={Intent.PRIMARY}
              onClick={handleSaveUrl}
              disabled={loading || !jobcanConfig.url}
              icon="floppy-disk"
            >
              保存
            </Button>
          </div>
        </FormGroup>

        <Divider style={{ margin: "20px 0" }} />

        {/* 認証情報設定 */}
        <form onSubmit={handleSaveCredentials}>
          <FormGroup
            label="メールアドレス"
            labelFor="email-input"
            helperText="Jobcanログイン用のメールアドレス"
          >
            <InputGroup
              id="email-input"
              type="email"
              value={jobcanConfig.email}
              onChange={(e) =>
                setJobcanConfig((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="your-email@example.com"
              leftIcon="envelope"
              required
            />
          </FormGroup>

          <FormGroup
            label="パスワード"
            labelFor="password-input"
            helperText="Jobcanログイン用のパスワード"
          >
            <InputGroup
              id="password-input"
              type="password"
              value={jobcanConfig.password}
              onChange={(e) =>
                setJobcanConfig((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="パスワードを入力"
              leftIcon="lock"
              required
            />
          </FormGroup>

          <div style={{ marginTop: "20px" }}>
            <ButtonGroup fill>
              <Button
                type="submit"
                intent={Intent.PRIMARY}
                disabled={
                  loading || !jobcanConfig.email || !jobcanConfig.password
                }
                icon={loading ? <Spinner size={16} /> : "floppy-disk"}
                large
                style={{ flexGrow: 2 }}
              >
                {loading ? "保存中..." : "認証情報を保存"}
              </Button>

              {jobcanConfig.isConfigured && (
                <Button
                  onClick={handleTestConfig}
                  disabled={loading}
                  intent={Intent.SUCCESS}
                  icon="play"
                  large
                >
                  テスト
                </Button>
              )}

              {jobcanConfig.isConfigured && (
                <Button
                  onClick={handleClearConfig}
                  disabled={loading}
                  intent={Intent.DANGER}
                  icon="trash"
                  large
                >
                  クリア
                </Button>
              )}
            </ButtonGroup>
          </div>
        </form>
      </Card>

      <Card elevation={1} style={{ marginTop: "20px", opacity: 0.6 }}>
        <H2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            margin: 0,
            marginBottom: "12px",
          }}
        >
          <Icon icon="chat" size={20} />
          SlackWF 設定
        </H2>
        <Callout intent={Intent.NONE} icon="info-sign">
          SlackWF設定は将来のバージョンで実装予定です
        </Callout>
      </Card>
    </div>
  );
};

export default SettingsPage;
