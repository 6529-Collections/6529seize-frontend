const globalScope = globalThis as typeof globalThis & {
  sessionStorage?: Storage | undefined;
};

const storage = globalScope.sessionStorage;

export const safeSessionStorage = {
  getItem: (key: string) => (storage ? storage.getItem(key) : null),
  setItem: (key: string, value: string) => {
    storage?.setItem(key, value);
  },
  removeItem: (key: string) => {
    storage?.removeItem(key);
  },
  clear: () => {
    storage?.clear();
  },
};
