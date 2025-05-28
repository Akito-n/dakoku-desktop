import { ipcMain } from "electron";
import { playwrightHandlers } from "./playwright";
import { settingsHandlers } from "./settings";
import { jobcanHandlers } from "./jobcan";
import { slackwfHandlers } from "./slackwf";

export function registerHandlers() {
  // Playwright関連のハンドラー
  for (const [channel, handler] of Object.entries(playwrightHandlers)) {
    ipcMain.handle(channel, handler);
  }

  // 設定関連のハンドラー
  for (const [channel, handler] of Object.entries(settingsHandlers)) {
    ipcMain.handle(channel, handler);
  }

  // Jobcan関連のハンドラー
  for (const [channel, handler] of Object.entries(jobcanHandlers)) {
    ipcMain.handle(channel, handler);
  }

  // SlackWF関連のハンドラー
  for (const [channel, handler] of Object.entries(slackwfHandlers)) {
    ipcMain.handle(channel, handler);
  }
}
