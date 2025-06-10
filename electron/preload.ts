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
});
contextBridge.exposeInMainWorld("electronAPI", {
  openJobcan: () => ipcRenderer.invoke("playwright:open-jobcan"),
  openSlackWF: () => ipcRenderer.invoke("playwright:open-slackwf"),

  jobcan: {
    execute: (action: CheckActionType, dryRun: boolean) =>
      ipcRenderer.invoke("jobcan:execute", action, dryRun),
  },

  slackwf: {
    execute: (action: CheckActionType) =>
      ipcRenderer.invoke("slackwf:execute", action),
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

    // SlackWF設定
    getSlackWF: () => ipcRenderer.invoke("config:get-slackwf"),
    setSlackWFCredentials: (
      workspaceName: string,
      googleEmail: string,
      googlePassword: string,
    ) =>
      ipcRenderer.invoke(
        "config:set-slackwf-credentials",
        workspaceName,
        googleEmail,
        googlePassword,
      ),
    setSlackWFUrl: (url: string) =>
      ipcRenderer.invoke("config:set-slackwf-url", url),
    setSlackWFChannel: (targetChannelUrl: string) =>
      ipcRenderer.invoke("config:set-slackwf-channel", targetChannelUrl),
    clearSlackWF: () => ipcRenderer.invoke("config:clear-slackwf"),
    testSlackWF: () => ipcRenderer.invoke("config:test-slackwf"),

    // 一般設定
    setSetting: (key: string, value: boolean) =>
      ipcRenderer.invoke("config:set-setting", key, value),

    // デバッグ用
    getDebugInfo: () => ipcRenderer.invoke("config:debug-info"),
  },
});
