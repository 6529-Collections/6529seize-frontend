export const isAvailable = typeof window !== "undefined";

export const safeLocalStorage = {
  getItem: (key: string) => (isAvailable ? localStorage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    if (isAvailable) localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (isAvailable) localStorage.removeItem(key);
  },
};
