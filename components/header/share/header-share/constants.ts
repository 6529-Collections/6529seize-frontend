export { DEFAULT_LOCALE as HEADER_SHARE_LOCALE } from "@/i18n/locales";

export enum Mode {
  PAGE_SHARE,
  CONNECT,
}

export enum SubMode {
  PAGE,
  MOBILE,
  DESKTOP,
}

export enum PageShareTarget {
  BROWSER = "browser",
  APP = "app",
}

export function getDefaultSubMode(mode: Mode): SubMode {
  return mode === Mode.PAGE_SHARE ? SubMode.PAGE : SubMode.MOBILE;
}

export const squareStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export function getConnectTargetCount(isElectron: boolean): number {
  return isElectron ? 1 : 2;
}

export function getAvailableConnectSubMode(
  activeSubTab: SubMode,
  isElectron: boolean
): SubMode {
  if (isElectron && activeSubTab === SubMode.DESKTOP) {
    return SubMode.MOBILE;
  }

  return activeSubTab;
}
