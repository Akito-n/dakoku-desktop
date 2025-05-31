import { useState } from "react";
import { HomePage } from "./pages/home";
import { Header } from "./features/common/components/Header";
import type { PageName } from "./features/common/types/header";
import SettingsPage from "./pages/settings";

function App() {
  const [currentPage, setCurrentPage] = useState<PageName>("home");

  const renderPageContent = () => {
    switch (currentPage) {
      case "settings":
        return <SettingsPage />;
      case "home":
        return <HomePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main
        style={{
          paddingTop: "70px",
          paddingBottom: "20px",
          minHeight: "calc(100vh - 70px)",
        }}
      >
        {renderPageContent()}
      </main>
    </div>
  );
}

export default App;
