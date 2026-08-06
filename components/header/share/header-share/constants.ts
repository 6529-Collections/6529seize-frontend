import { DEFAULT_LOCALE } from "@/i18n/locales";

export const HEADER_SHARE_LOCALE = DEFAULT_LOCALE;

export enum Mode {
  PAGE_SHARE,
  CONNECT,
}

export enum SubMode {
  PAGE,
  MOBILE,
  DESKTOP,
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
