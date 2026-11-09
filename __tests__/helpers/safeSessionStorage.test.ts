import { safeSessionStorage } from "@/helpers/safeSessionStorage";

const storageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage"
)!;

afterEach(() => {
  Object.defineProperty(globalThis, "sessionStorage", storageDescriptor);
  jest.restoreAllMocks();
  sessionStorage.clear();
});

function expectUnavailableStorage() {
  expect(safeSessionStorage.getItem("sidebarCollapsed")).toBeNull();
  expect(safeSessionStorage.setItem("sidebarCollapsed", "false")).toBe(false);
  expect(() => safeSessionStorage.removeItem("sidebarCollapsed")).not.toThrow();
  expect(() => safeSessionStorage.clear()).not.toThrow();
}

it("imports without reading a blocked sessionStorage getter", () => {
  const getter = jest.fn(() => {
    throw new DOMException(
      "Access is denied for this document.",
      "SecurityError"
    );
  });
  Object.defineProperty(globalThis, "sessionStorage", { get: getter });

  expect(() => {
    jest.isolateModules(() => {
      jest.requireActual("@/helpers/safeSessionStorage");
    });
  }).not.toThrow();
  expect(getter).not.toHaveBeenCalled();
  expectUnavailableStorage();
});

it("tolerates missing storage and uses it when it becomes available", () => {
  Object.defineProperty(globalThis, "sessionStorage", { value: undefined });
  expectUnavailableStorage();
  Object.defineProperty(globalThis, "sessionStorage", storageDescriptor);

  expect(safeSessionStorage.setItem("sidebarCollapsed", "false")).toBe(true);
  expect(sessionStorage.getItem("sidebarCollapsed")).toBe("false");
  expect(safeSessionStorage.getItem("sidebarCollapsed")).toBe("false");
  safeSessionStorage.removeItem("sidebarCollapsed");
  expect(sessionStorage.getItem("sidebarCollapsed")).toBeNull();
  safeSessionStorage.setItem("sidebarCollapsed", "true");
  safeSessionStorage.clear();
  expect(sessionStorage.length).toBe(0);
});

it("tolerates storage operation failures and recovers on the next call", () => {
  const blocked = () => {
    throw new DOMException("Storage is unavailable.", "QuotaExceededError");
  };
  jest.spyOn(Storage.prototype, "getItem").mockImplementationOnce(blocked);
  jest.spyOn(Storage.prototype, "setItem").mockImplementationOnce(blocked);
  jest.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(blocked);
  jest.spyOn(Storage.prototype, "clear").mockImplementationOnce(blocked);

  expectUnavailableStorage();
  expect(safeSessionStorage.setItem("sidebarCollapsed", "false")).toBe(true);
  expect(safeSessionStorage.getItem("sidebarCollapsed")).toBe("false");
});

it("retries persistence after repeated write failures when storage recovers", () => {
  const storage = sessionStorage;
  let isBlocked = true;
  Object.defineProperty(globalThis, "sessionStorage", {
    value: {
      setItem(key: string, value: string) {
        if (isBlocked) throw new DOMException("Access denied", "SecurityError");
        storage.setItem(key, value);
      },
    },
  });

  expect(safeSessionStorage.setItem("sidebarCollapsed", "false")).toBe(false);
  expect(safeSessionStorage.setItem("sidebarCollapsed", "false")).toBe(false);
  expect(storage.getItem("sidebarCollapsed")).toBeNull();
  isBlocked = false;
  expect(safeSessionStorage.setItem("sidebarCollapsed", "false")).toBe(true);
  expect(storage.getItem("sidebarCollapsed")).toBe("false");
});
