const globalScope = globalThis as {
  sessionStorage?: Storage | undefined;
};

export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return globalScope.sessionStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  // Report persistence failure so reload guards can fail closed.
  setItem: (key: string, value: string): boolean => {
    try {
      const storage = globalScope.sessionStorage;
      if (storage === undefined) return false;
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem: (key: string) => {
    try {
      globalScope.sessionStorage?.removeItem(key);
    } catch {
      // Optional session state may be unavailable in restricted documents.
    }
  },
  clear: () => {
    try {
      globalScope.sessionStorage?.clear();
    } catch {
      // Optional session state may be unavailable in restricted documents.
    }
  },
};
