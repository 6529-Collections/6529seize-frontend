import { isDesktopApp } from "@/helpers/desktop-shell";

/** True in any 6529 Desktop build (see `isDesktopApp`). */
export const useElectron = (): boolean => isDesktopApp();
