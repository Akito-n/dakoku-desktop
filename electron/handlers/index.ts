import { ipcMain } from "electron";
import { playwrightHandlers } from "./playwright";

export function registerHandlers() {
  for (const [channel, handler] of Object.entries(playwrightHandlers)) {
    ipcMain.handle(channel, handler);
  }
}
