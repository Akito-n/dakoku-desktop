import { useState } from "react";
import {
  Navbar,
  NavbarGroup,
  NavbarHeading,
  Button,
  Alignment,
  Intent,
  Card,
  Icon,
  ButtonGroup,
  Divider,
  OverlayToaster,
  type IconName,
} from "@blueprintjs/core";
import SettingsPage from "./features/settings/components/SettingsPage";
import CurrentTimeDisplay from "./features/common/components/CurrentTimeDisplay";

type CurrentPage = "home" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>("home");
  const [loading, setLoading] = useState<string | null>(null);

  const showToast = (message: string, intent: Intent, icon: IconName) => {
    OverlayToaster.create({ position: "top" }).show({
      message,
      intent,
      icon,
      timeout: intent === Intent.DANGER ? 5000 : 3000,
    });
  };

  const handleJobcanCheckBoth = async () => {
    try {
      await window.electronAPI.jobcan.execute("check-both");
      console.log("両方の打刻完了");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleJobcanCheckIn = async () => {
    try {
      await window.electronAPI.jobcan.execute("check-in");
      console.log("出勤打刻完了");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleJobcanCheckOut = async () => {
    try {
      await window.electronAPI.jobcan.execute("check-out");
      console.log("退勤打刻完了");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSlackWFTest = async () => {
    try {
      console.log("SlackWF機能は未実装です");
      showToast("SlackWF機能は未実装です", Intent.WARNING, "info-sign");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // ページコンテンツのレンダリング
  const renderPageContent = () => {
    switch (currentPage) {
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            <Card
              elevation={2}
              style={{ textAlign: "center", padding: "40px" }}
            >
              <div style={{ marginBottom: "40px" }}>
                <CurrentTimeDisplay
                  size="large"
                  elevation={0}
                  showIcon={true}
                  showDate={true}
                  showSeconds={true}
                  transparent={true}
                />
              </div>

              <div style={{ marginBottom: "30px" }}>
                <ButtonGroup large vertical style={{ minWidth: "320px" }}>
                  <Button
                    intent={Intent.PRIMARY}
                    onClick={handleJobcanCheckBoth}
                    icon="office"
                    large
                    loading={loading === "both"}
                    style={{
                      height: "65px",
                      fontSize: "16px",
                      fontWeight: "600",
                    }}
                  >
                    {loading === "both" ? "打刻実行中..." : "Jobcan 出退勤"}
                  </Button>

                  {/* 🔧 サブオプション：個別打刻（小さめ） */}
                  <div style={{ marginTop: "12px" }}>
                    <ButtonGroup fill style={{ display: "flex", gap: "2px" }}>
                      <Button
                        intent={Intent.SUCCESS}
                        onClick={handleJobcanCheckIn}
                        icon="log-in"
                        loading={loading === "clock-in"}
                        style={{
                          flex: 1,
                          height: "45px",
                          fontSize: "14px",
                        }}
                      >
                        {loading === "clock-in" ? "実行中..." : "出勤"}
                      </Button>
                      <Button
                        intent={Intent.SUCCESS}
                        onClick={handleJobcanCheckOut}
                        icon="log-out"
                        loading={loading === "clock-out"}
                        style={{
                          flex: 1,
                          height: "45px",
                          fontSize: "14px",
                        }}
                      >
                        {loading === "clock-out" ? "実行中..." : "退勤"}
                      </Button>
                    </ButtonGroup>
                  </div>
                </ButtonGroup>
              </div>

              <Divider style={{ margin: "30px 0" }} />

              {/* その他のアクション */}
              <ButtonGroup style={{ marginBottom: "20px" }}>
                <Button
                  intent={Intent.NONE}
                  onClick={handleSlackWFTest}
                  icon="chat"
                  large
                  style={{ height: "50px", fontSize: "14px" }}
                >
                  SlackWF を起動
                </Button>
              </ButtonGroup>

              <Divider style={{ margin: "20px 0" }} />

              {/* 設定ボタン */}
              <Button
                intent={Intent.SUCCESS}
                onClick={() => setCurrentPage("settings")}
                icon="cog"
                large
                outlined
              >
                設定管理を開く
              </Button>
            </Card>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ナビゲーションバー */}
      <Navbar
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #d3d8de",
          padding: "0 20px",
        }}
      >
        <NavbarGroup align={Alignment.LEFT}>
          <NavbarHeading
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Icon icon="time" size={18} />
            Dakoku Desktop
          </NavbarHeading>
        </NavbarGroup>
        <NavbarGroup align={Alignment.RIGHT}>
          <Button
            minimal
            icon="home"
            text="ホーム"
            active={currentPage === "home"}
            onClick={() => setCurrentPage("home")}
          />
          <Button
            minimal
            icon="cog"
            text="設定"
            active={currentPage === "settings"}
            onClick={() => setCurrentPage("settings")}
          />
        </NavbarGroup>
      </Navbar>

      <main style={{ paddingTop: "20px", paddingBottom: "20px" }}>
        {renderPageContent()}
      </main>
    </div>
  );
}

export default App;
