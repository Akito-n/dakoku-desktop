export type PageName = "home" | "settings";

export interface NavigationItem {
  key: PageName;
  label: string;
  icon: string;
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    key: "home",
    label: "ホーム",
    icon: "home",
  },
  {
    key: "settings",
    label: "設定",
    icon: "cog",
  },
] as const;
