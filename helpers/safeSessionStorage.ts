const isAvailable = typeof window !== "undefined";

export const safeSessionStorage = {
  getItem: (key: string) => (isAvailable ? sessionStorage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    if (isAvailable) sessionStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (isAvailable) sessionStorage.removeItem(key);
  },
  clear: () => {
    if (isAvailable) sessionStorage.clear();
  },
};