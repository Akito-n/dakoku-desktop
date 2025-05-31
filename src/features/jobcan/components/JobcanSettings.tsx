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

interface JobcanConfig {
  email: string;
  password: string;
  url: string;
  isConfigured: boolean;
}

export const JobcanSettings: React.FC = () => {
  const [jobcanConfig, setJobcanConfig] = useState<JobcanConfig>({
    email: "",
    password: "",
    url: "",
    isConfigured: false,
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();

  // 初期データ読み込み
  useEffect(() => {
    const loadJobcanConfig = async () => {
      try {
        const config = await window.electronAPI.config.getJobcan();
        setJobcanConfig(config);
      } catch (error) {
        console.error("Jobcan設定の読み込みに失敗:", error);
        showError("Jobcan設定の読み込みに失敗しました");
      }
    };

    loadJobcanConfig();
  }, [showError]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await window.electronAPI.config.setJobcanCredentials(
        jobcanConfig.email,
        jobcanConfig.password,
      );

      setJobcanConfig((prev) => ({ ...prev, ...result }));
      showSuccess("Jobcan認証情報を保存しました");
    } catch (error) {
      console.error("保存エラー:", error);
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
      await window.electronAPI.config.setJobcanUrl(jobcanConfig.url);
      showSuccess("JobcanのURLを保存しました");
    } catch (error) {
      console.error("URL保存エラー:", error);
      showError(
        error instanceof Error ? error.message : "URLの保存に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearConfig = async () => {
    setLoading(true);

    try {
      const result = await window.electronAPI.config.clearJobcan();
      setJobcanConfig((prev) => ({ ...prev, ...result, isConfigured: false }));
      showWarning("Jobcanの設定をクリアしました");
    } catch (error) {
      console.error("クリアエラー:", error);
      showError("設定のクリアに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConfig = async () => {
    setLoading(true);

    try {
      const result = await window.electronAPI.config.testJobcan();
      showSuccess(result.message);
    } catch (error) {
      console.error("テストエラー:", error);
      showError(
        error instanceof Error ? error.message : "テストに失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={2} style={{ marginBottom: "20px" }}>
      {/* Jobcan設定ヘッダー */}
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
  );
};
