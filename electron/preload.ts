import { ipcRenderer, contextBridge } from "electron";
import type { CheckActionType } from "../src/types/check";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});
contextBridge.exposeInMainWorld("electronAPI", {
  openJobcan: () => ipcRenderer.invoke("playwright:open-jobcan"),
  openSlackWF: () => ipcRenderer.invoke("playwright:open-slackwf"),

  jobcan: {
    execute: (action: CheckActionType) =>
      ipcRenderer.invoke("jobcan:execute", action),
  },

  // === 設定管理API ===
  config: {
    getAll: () => ipcRenderer.invoke("config:get-all"),

    // Jobcan設定
    getJobcan: () => ipcRenderer.invoke("config:get-jobcan"),
    setJobcanCredentials: (email: string, password: string) =>
      ipcRenderer.invoke("config:set-jobcan-credentials", email, password),
    setJobcanUrl: (url: string) =>
      ipcRenderer.invoke("config:set-jobcan-url", url),
    clearJobcan: () => ipcRenderer.invoke("config:clear-jobcan"),
    testJobcan: () => ipcRenderer.invoke("config:test-jobcan"),
    getAttendance: () => ipcRenderer.invoke("config:get-attendance"),
    setAttendance: (startTime: string, endTime: string) =>
      ipcRenderer.invoke("config:set-attendance", startTime, endTime),

    // 一般設定
    setSetting: (key: string, value: boolean) =>
      ipcRenderer.invoke("config:set-setting", key, value),

    // デバッグ用
    getDebugInfo: () => ipcRenderer.invoke("config:debug-info"),
  },
});
