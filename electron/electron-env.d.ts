/// <reference types="vite-plugin-electron/electron-env" />
/// <reference types="vite/client" />

// Import types for settings
import type { AppConfig } from "../src/main/store/settings";

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
    /** Jobcan URL for playwright */
    JOBCAN_URL?: string;
    /** Exit method for playwright process */
    EXIT_METHOD?: string;
  }
}

// Used in Renderer process, expose in `preload.ts`
