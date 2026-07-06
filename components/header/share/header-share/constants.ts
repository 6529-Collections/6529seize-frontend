import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const HEADER_SHARE_LOCALE = DEFAULT_LOCALE;

export enum Mode {
  NAVIGATE,
  SHARE,
  APPS,
}

export enum SubMode {
  BROWSER,
  APP,
  CORE,
}

export const squareStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function getSubTabCount(activeTab: Mode, isElectron: boolean): number {
  if (activeTab === Mode.NAVIGATE) {
    return isElectron ? 2 : 3;
  }
  return isElectron ? 1 : 2;
}

export function getSubTabLabel(activeTab: Mode): string {
  if (activeTab === Mode.APPS) {
    return t(HEADER_SHARE_LOCALE, "headerShare.menu.selectPlatform");
  }
  if (activeTab === Mode.SHARE) {
    return t(HEADER_SHARE_LOCALE, "headerShare.menu.openLinkIn");
  }
  return t(HEADER_SHARE_LOCALE, "headerShare.menu.openUrlIn");
}
