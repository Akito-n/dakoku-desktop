import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/electron-vite.svg";

function App() {
  const [count, setCount] = useState(0);

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

  return (
    <>
      <div>
        <a href="https://electron-vite.org" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Dakoku Desktop</h1>
      <div className="card">
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <div style={{ marginTop: "20px" }}>
          <button
            type="button"
            onClick={handleJobcanTest}
            style={{ margin: "10px" }}
          >
            Test Jobcan
          </button>
          <button
            type="button"
            onClick={handleSlackWFTest}
            style={{ margin: "10px" }}
          >
            Test SlackWF
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
