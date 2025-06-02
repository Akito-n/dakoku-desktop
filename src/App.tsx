import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./pages/home";
import { Header } from "./features/common/components/Header";
import type { PageName } from "./features/common/types/header";
import SettingsPage from "./pages/settings";
import { queryClient, shouldShowDevTools } from "./lib/queryClient";
import { DevTools } from "./lib/Devtools";

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
    <QueryClientProvider client={queryClient}>
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
      <DevTools show={shouldShowDevTools} />
    </QueryClientProvider>
  );
}

export default App;
