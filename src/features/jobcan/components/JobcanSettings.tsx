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
  useJobcanConfig,
  useUpdateJobcanCredentials,
  useUpdateJobcanUrl,
  useClearJobcanConfig,
  useTestJobcanConfig,
} from "../hooks/useJobcanQuery";

export const JobcanSettings: React.FC = () => {
  const {
    data: jobcanConfig,
    isLoading: isLoadingConfig,
    error: loadError,
  } = useJobcanConfig();

  const updateCredentialsMutation = useUpdateJobcanCredentials();
  const updateUrlMutation = useUpdateJobcanUrl();
  const clearConfigMutation = useClearJobcanConfig();
  const testConfigMutation = useTestJobcanConfig();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    url: "",
  });

  const { showSuccess, showError, showWarning } = useToast();

  useEffect(() => {
    if (jobcanConfig) {
      setFormData({
        email: jobcanConfig.email,
        password: jobcanConfig.password,
        url: jobcanConfig.url,
      });
    }
  }, [jobcanConfig]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCredentialsMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      });
      showSuccess("Jobcan認証情報を保存しました");
    } catch (error) {
      console.error("保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "認証情報の保存に失敗しました",
      );
    }
  };

  const handleSaveUrl = async () => {
    try {
      await updateUrlMutation.mutateAsync(formData.url);
      showSuccess("JobcanのURLを保存しました");
    } catch (error) {
      console.error("URL保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "URLの保存に失敗しました",
      );
    }
  };

  const handleClearConfig = async () => {
    try {
      await clearConfigMutation.mutateAsync();
      showWarning("Jobcanの設定をクリアしました");
    } catch (error) {
      console.error("クリアエラー:", error);
      showError("設定のクリアに失敗しました");
    }
  };

  const handleTestConfig = async () => {
    try {
      const result = await testConfigMutation.mutateAsync();
      showSuccess(result.message);
    } catch (error) {
      console.error("テストエラー:", error);
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
          <div>Jobcan設定の読み込みに失敗しました</div>
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
          <div style={{ marginTop: "10px" }}>Jobcan設定を読み込み中...</div>
        </div>
      </Card>
    );
  }

  const isLoading =
    updateCredentialsMutation.isPending ||
    updateUrlMutation.isPending ||
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
          <Icon icon="office" size={20} />
          Jobcan 設定
        </H2>
        <Tag
          intent={jobcanConfig?.isConfigured ? Intent.SUCCESS : Intent.NONE}
          icon={jobcanConfig?.isConfigured ? "tick" : "cross"}
          large
        />
      </div>

      <FormGroup
        label="Jobcan URL"
        helperText="JobcanのログインページURLを指定してください"
      >
        <div style={{ display: "flex", gap: "10px" }}>
          <InputGroup
            value={formData.url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder="https://id.jobcan.jp/users/sign_in"
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
          label="メールアドレス"
          labelFor="email-input"
          helperText="Jobcanログイン用のメールアドレス"
        >
          <InputGroup
            id="email-input"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
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
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({
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
              disabled={isLoading || !formData.email || !formData.password}
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

            {jobcanConfig?.isConfigured && (
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

            {jobcanConfig?.isConfigured && (
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
