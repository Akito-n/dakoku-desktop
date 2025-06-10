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
import {
  useSlackWFConfig,
  useUpdateSlackWFCredentials,
  useUpdateSlackWFUrl,
  useUpdateSlackWFChannel,
  useClearSlackWFConfig,
  useTestSlackWFConfig,
} from "../hooks/useSlackWFQuery";

export const SlackWFSettings: React.FC = () => {
  const {
    data: slackwfConfig,
    isLoading: isLoadingConfig,
    error: loadError,
  } = useSlackWFConfig();

  const updateCredentialsMutation = useUpdateSlackWFCredentials();
  const updateUrlMutation = useUpdateSlackWFUrl();
  const updateChannelMutation = useUpdateSlackWFChannel();
  const clearConfigMutation = useClearSlackWFConfig();
  const testConfigMutation = useTestSlackWFConfig();

  const [formData, setFormData] = useState({
    workspaceName: "",
    googleEmail: "",
    googlePassword: "",
    targetChannelUrl: "",
    url: "",
  });

  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    if (slackwfConfig) {
      setFormData({
        workspaceName: slackwfConfig.workspaceName,
        googleEmail: slackwfConfig.googleEmail,
        googlePassword: slackwfConfig.googlePassword,
        targetChannelUrl: slackwfConfig.targetChannelUrl,
        url: slackwfConfig.url,
      });
    }
  }, [slackwfConfig]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCredentialsMutation.mutateAsync({
        workspaceName: formData.workspaceName,
        googleEmail: formData.googleEmail,
        googlePassword: formData.googlePassword,
      });
      showSuccess("SlackWF認証情報を保存しました");
    } catch (error) {
      console.error("SlackWF保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "認証情報の保存に失敗しました",
      );
    }
  };

  const handleSaveUrl = async () => {
    try {
      await updateUrlMutation.mutateAsync(formData.url);
      showSuccess("SlackWFのURLを保存しました");
    } catch (error) {
      console.error("SlackWF URL保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "URLの保存に失敗しました",
      );
    }
  };

  const handleSaveChannel = async () => {
    try {
      await updateChannelMutation.mutateAsync(formData.targetChannelUrl);
      showSuccess("SlackWFチャンネルURLを保存しました");
    } catch (error) {
      console.error("SlackWFチャンネル保存エラー:", error);
      showError(
        error instanceof Error
          ? error.message
          : "チャンネルURLの保存に失敗しました",
      );
    }
  };

  const handleClearConfig = async () => {
    try {
      await clearConfigMutation.mutateAsync();
      showWarning("SlackWFの設定をクリアしました");
    } catch (error) {
      console.error("SlackWFクリアエラー:", error);
      showError("設定のクリアに失敗しました");
    }
  };

  const handleTestConfig = async () => {
    try {
      const result = await window.electronAPI.slackwf.execute("check-in", true);
      showSuccess(result.message);
    } catch (error) {
      console.error("SlackWFテストエラー:", error);
      showError(
        error instanceof Error ? error.message : "テストに失敗しました",
      );
    }
  };
  if (loadError) {
    return (
      <Card elevation={2} style={{ marginBottom: "20px" }}>
        <div style={{ textAlign: "center", padding: "20px", color: "#cd5c5c" }}>
          <Icon icon="error" size={24} style={{ marginBottom: "10px" }} />
          <div>SlackWF設定の読み込みに失敗しました</div>
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
          <div style={{ marginTop: "10px" }}>SlackWF設定を読み込み中...</div>
        </div>
      </Card>
    );
  }

  const isLoading =
    updateCredentialsMutation.isPending ||
    updateUrlMutation.isPending ||
    updateChannelMutation.isPending ||
    clearConfigMutation.isPending ||
    testConfigMutation.isPending;

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
          intent={slackwfConfig?.isConfigured ? Intent.SUCCESS : Intent.NONE}
          icon={slackwfConfig?.isConfigured ? "tick" : "cross"}
          large
        />
      </div>

      <FormGroup
        label="SlackWF URL"
        helperText="SlackワークスペースのサインインページURLを指定してください"
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <InputGroup
            value={formData.url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder="https://slack.com/intl/ja-jp/workspace-signin"
            leftIcon="link"
            style={{ flexGrow: 1 }}
          />
          <Button
            intent={Intent.PRIMARY}
            onClick={handleSaveUrl}
            disabled={isLoading || !formData.url}
            icon="floppy-disk"
          >
            保存
          </Button>
        </div>
      </FormGroup>

      <Divider style={{ margin: "20px 0" }} />

      <form onSubmit={handleSaveCredentials}>
        <FormGroup
          label="ワークスペース名"
          labelFor="workspace-input"
          helperText="Slackワークスペース名（例: aitravel）"
        >
          <InputGroup
            id="workspace-input"
            type="text"
            value={formData.workspaceName}
            onChange={(e) =>
              setFormData((prev) => ({
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
            value={formData.googleEmail}
            onChange={(e) =>
              setFormData((prev) => ({
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
            value={formData.googlePassword}
            onChange={(e) =>
              setFormData((prev) => ({
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
              value={formData.targetChannelUrl}
              onChange={(e) =>
                setFormData((prev) => ({
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
              disabled={isLoading || !formData.targetChannelUrl}
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
                isLoading ||
                !formData.workspaceName ||
                !formData.googleEmail ||
                !formData.googlePassword
              }
              icon={
                updateCredentialsMutation.isPending ? (
                  <Spinner size={16} />
                ) : (
                  "floppy-disk"
                )
              }
              large
              style={{ flexGrow: 2 }}
            >
              {updateCredentialsMutation.isPending
                ? "保存中..."
                : "認証情報を保存"}
            </Button>

            {slackwfConfig?.isConfigured && (
              <Button
                onClick={handleTestConfig}
                disabled={isLoading}
                intent={Intent.SUCCESS}
                icon="play"
                large
              >
                テスト
              </Button>
            )}

            {slackwfConfig?.isConfigured && (
              <Button
                onClick={handleClearConfig}
                disabled={isLoading}
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
