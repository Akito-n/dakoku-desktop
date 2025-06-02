import { useState, useEffect } from "react";
import {
  Card,
  FormGroup,
  InputGroup,
  Button,
  Intent,
  H2,
  Icon,
  Tag,
  ButtonGroup,
  Divider,
  Spinner,
} from "@blueprintjs/core";
import { useToast } from "../../common/hooks/useToast";

interface SlackWFConfig {
  workspaceName: string;
  googleEmail: string;
  googlePassword: string;
  targetChannelUrl: string;
  url: string;
  isConfigured: boolean;
}

export const SlackWFSettings: React.FC = () => {
  const [slackwfConfig, setSlackwfConfig] = useState<SlackWFConfig>({
    workspaceName: "",
    googleEmail: "",
    googlePassword: "",
    targetChannelUrl: "",
    url: "",
    isConfigured: false,
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();

  // 初期データ読み込み
  useEffect(() => {
    const loadSlackWFConfig = async () => {
      try {
        const config = await window.electronAPI.config.getSlackWF();
        setSlackwfConfig(config);
      } catch (error) {
        console.error("SlackWF設定の読み込みに失敗:", error);
        showError("SlackWF設定の読み込みに失敗しました");
      }
    };

    loadSlackWFConfig();
  }, []);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await window.electronAPI.config.setSlackWFCredentials(
        slackwfConfig.workspaceName,
        slackwfConfig.googleEmail,
        slackwfConfig.googlePassword,
      );

      setSlackwfConfig((prev) => ({ ...prev, ...result }));
      showSuccess("SlackWF認証情報を保存しました");
    } catch (error) {
      console.error("SlackWF保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "認証情報の保存に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUrl = async () => {
    setLoading(true);

    try {
      await window.electronAPI.config.setSlackWFUrl(slackwfConfig.url);
      showSuccess("SlackWFのURLを保存しました");
    } catch (error) {
      console.error("SlackWF URL保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "URLの保存に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChannel = async () => {
    setLoading(true);

    try {
      const result = await window.electronAPI.config.setSlackWFChannel(
        slackwfConfig.targetChannelUrl,
      );
      setSlackwfConfig((prev) => ({ ...prev, ...result }));
      showSuccess("SlackWFチャンネルURLを保存しました");
    } catch (error) {
      console.error("SlackWFチャンネル保存エラー:", error);
      showError(
        error instanceof Error
          ? error.message
          : "チャンネルURLの保存に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfig = async () => {
    setLoading(true);

    try {
      const result = await window.electronAPI.config.clearSlackWF();
      setSlackwfConfig((prev) => ({ ...prev, ...result, isConfigured: false }));
      showWarning("SlackWFの設定をクリアしました");
    } catch (error) {
      console.error("SlackWFクリアエラー:", error);
      showError("設定のクリアに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConfig = async () => {
    setLoading(true);

    try {
      const result = await window.electronAPI.config.testSlackWF();
      showSuccess(result.message);
    } catch (error) {
      console.error("SlackWFテストエラー:", error);
      showError(
        error instanceof Error ? error.message : "テストに失敗しました",
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
          <Icon icon="chat" size={20} />
          SlackWF 設定
        </H2>
        <Tag
          intent={slackwfConfig.isConfigured ? Intent.SUCCESS : Intent.NONE}
          icon={slackwfConfig.isConfigured ? "tick" : "cross"}
          large
        />
      </div>

      {/* URL設定 */}
      <FormGroup
        label="SlackWF URL"
        helperText="SlackワークスペースのサインインページURLを指定してください"
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <InputGroup
            value={slackwfConfig.url}
            onChange={(e) =>
              setSlackwfConfig((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder="https://slack.com/intl/ja-jp/workspace-signin"
            leftIcon="link"
            style={{ flexGrow: 1 }}
          />
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSaveUrl}
            disabled={loading || !slackwfConfig.url}
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
          label="ワークスペース名"
          labelFor="workspace-input"
          helperText="Slackワークスペース名（例: aitravel）"
        >
          <InputGroup
            id="workspace-input"
            type="text"
            value={slackwfConfig.workspaceName}
            onChange={(e) =>
              setSlackwfConfig((prev) => ({
                ...prev,
                workspaceName: e.target.value,
              }))
            }
            placeholder="aitravel"
            leftIcon="office"
            required
          />
        </FormGroup>

        <FormGroup
          label="Googleメールアドレス"
          labelFor="google-email-input"
          helperText="Google認証用のメールアドレス"
        >
          <InputGroup
            id="google-email-input"
            type="email"
            value={slackwfConfig.googleEmail}
            onChange={(e) =>
              setSlackwfConfig((prev) => ({
                ...prev,
                googleEmail: e.target.value,
              }))
            }
            placeholder="your-email@gmail.com"
            leftIcon="envelope"
            required
          />
        </FormGroup>

        <FormGroup
          label="Googleパスワード"
          labelFor="google-password-input"
          helperText="Google認証用のパスワード"
        >
          <InputGroup
            id="google-password-input"
            type="password"
            value={slackwfConfig.googlePassword}
            onChange={(e) =>
              setSlackwfConfig((prev) => ({
                ...prev,
                googlePassword: e.target.value,
              }))
            }
            placeholder="パスワードを入力"
            leftIcon="lock"
            required
          />
        </FormGroup>

        <FormGroup
          label="チャンネルURL（オプション）"
          labelFor="channel-url-input"
          helperText="目的のSlackチャンネルURL（後で設定可能）"
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <InputGroup
              id="channel-url-input"
              type="url"
              value={slackwfConfig.targetChannelUrl}
              onChange={(e) =>
                setSlackwfConfig((prev) => ({
                  ...prev,
                  targetChannelUrl: e.target.value,
                }))
              }
              placeholder="https://app.slack.com/client/T4Y2T7AMN/C04KCRXBQ1L"
              leftIcon="link"
              style={{ flexGrow: 1 }}
            />
            <Button
              onClick={handleSaveChannel}
              disabled={loading || !slackwfConfig.targetChannelUrl}
              icon="floppy-disk"
            >
              保存
            </Button>
          </div>
        </FormGroup>

        <div style={{ marginTop: "20px" }}>
          <ButtonGroup fill>
            <Button
              type="submit"
              intent={Intent.PRIMARY}
              disabled={
                loading ||
                !slackwfConfig.workspaceName ||
                !slackwfConfig.googleEmail ||
                !slackwfConfig.googlePassword
              }
              icon={loading ? <Spinner size={16} /> : "floppy-disk"}
              large
              style={{ flexGrow: 2 }}
            >
              {loading ? "保存中..." : "認証情報を保存"}
            </Button>

            {slackwfConfig.isConfigured && (
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

            {slackwfConfig.isConfigured && (
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
  );
};
