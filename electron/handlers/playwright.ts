import { spawn } from "node:child_process";
import path from "node:path";

export const playwrightHandlers = {
  "playwright:open-jobcan": async () => {
    console.log("Starting Jobcan browser...");
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        process.cwd(),
        "scripts",
        "playwright-runner.cjs",
      ); // .cjsに変更
      const child = spawn("node", [scriptPath, "jobcan"], {
        stdio: "inherit",
      });

      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) {
          console.log("Jobcan browser opened successfully!");
          resolve(undefined);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  },

  "playwright:open-slackwf": async () => {
    console.log("Starting SlackWF browser...");
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(
        process.cwd(),
        "scripts",
        "playwright-runner.cjs",
      ); // .cjsに変更
      const child = spawn("node", [scriptPath, "slackwf"], {
        stdio: "inherit",
      });

      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) {
          console.log("SlackWF browser opened successfully!");
          resolve(undefined);
        } else {
          reject(new Error(`Process exited with code ${code}`));
        }
      });
    });
  },
};
