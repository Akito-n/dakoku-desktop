import { ipcMain } from "electron";
import { playwrightHandlers } from "./playwright";
import { configHandlers } from "./settings";

export function registerHandlers() {
  // Playwright関連のハンドラー
  for (const [channel, handler] of Object.entries(playwrightHandlers)) {
    ipcMain.handle(channel, handler);
  }

  // 設定関連のハンドラー
  for (const [channel, handler] of Object.entries(configHandlers)) {
    ipcMain.handle(channel, handler);
  }
}
