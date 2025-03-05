export const useElectron = () => {
  if (typeof window === "undefined") return false;

  if (
    navigator &&
    navigator.userAgent &&
    navigator.userAgent.includes("Electron")
  ) {
    return true;
  }

  return false;
};
