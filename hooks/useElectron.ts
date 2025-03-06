export const useElectron = () => {
  if (typeof window === "undefined") return false;
  return navigator?.userAgent?.includes("Electron");
};
