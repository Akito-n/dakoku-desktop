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
} from "@blueprintjs/core";
import SettingsPage from "./features/settings/components/SettingsPage";
import CurrentTimeDisplay from "./features/common/components/CurrentTimeDisplay";

type CurrentPage = "home" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<CurrentPage>("home");

  const handleJobcanTest = async () => {
    try {
      await window.electronAPI.openJobcan();
      console.log("Jobcan navigation completed");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSlackWFTest = async () => {
    try {
      await window.electronAPI.openSlackWF();
      console.log("SlackWF navigation completed");
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // ページコンテンツのレンダリング
  const renderPageContent = () => {
    switch (currentPage) {
      case "settings":
        return <SettingsPage />;
      // case "home":
      default:
        return (
          <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
            <Card
              elevation={2}
              style={{ textAlign: "center", padding: "40px" }}
            >
              {/* メイン時間表示 */}
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

              {/* アクションボタン */}
              <ButtonGroup large vertical style={{ minWidth: "300px" }}>
                <Button
                  intent={Intent.PRIMARY}
                  onClick={handleJobcanTest}
                  icon="office"
                  large
                  style={{ height: "60px", fontSize: "16px" }}
                >
                  Jobcan を起動
                </Button>
                <Button
                  intent={Intent.NONE}
                  onClick={handleSlackWFTest}
                  icon="chat"
                  large
                  style={{ height: "60px", fontSize: "16px" }}
                >
                  SlackWF を起動
                </Button>
              </ButtonGroup>

              <Divider style={{ margin: "30px 0" }} />

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
          <NavbarHeading>
            <Icon icon="time" style={{ marginRight: "8px" }} />
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

      {/* メインコンテンツ */}
      <main style={{ paddingTop: "20px", paddingBottom: "20px" }}>
        {renderPageContent()}
      </main>
    </div>
  );
}

export default App;
