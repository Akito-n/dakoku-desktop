import type React from "react";
import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    intent: Intent;
    text: string;
    icon: IconName;
  } | null>(null);

  // 設定読み込み
  useEffect(() => {
    loadJobcanConfig();
  }, []);

  const loadJobcanConfig = async () => {
    try {
      const config = await window.electronAPI.config.getJobcan();
      setJobcanConfig(config);
    } catch (error) {
      console.error("設定の読み込みに失敗:", error);
      setMessage({
        intent: Intent.DANGER,
        text: "設定の読み込みに失敗しました",
        icon: "error",
      });
    }
  };

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

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      {/* ヘッダー */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <H1>
          <Icon icon="cog" style={{ marginRight: "10px" }} />
          設定管理
        </H1>
        <p style={{ color: "#5c7080", fontSize: "16px" }}>
          Dakoku Desktop の各種設定を管理します
        </p>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <Callout
          intent={message.intent}
          icon={message.icon}
          style={{ marginBottom: "20px" }}
        >
          {message.text}
        </Callout>
      )}

      {/* Jobcan設定カード */}
      <Card elevation={2}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <H2 style={{ margin: 0 }}>
            <Icon icon="office" style={{ marginRight: "8px" }} />
            Jobcan 設定
          </H2>
          <Tag
            intent={jobcanConfig.isConfigured ? Intent.SUCCESS : Intent.NONE}
            icon={jobcanConfig.isConfigured ? "tick" : "cross"}
            large
          >
            {jobcanConfig.isConfigured ? "設定済み" : "未設定"}
          </Tag>
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

      {/* 将来の拡張用プレースホルダー */}
      <Card elevation={1} style={{ marginTop: "20px", opacity: 0.6 }}>
        <H2>
          <Icon icon="chat" style={{ marginRight: "8px" }} />
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
