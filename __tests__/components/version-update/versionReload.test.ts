import {
  beginVersionReload,
  finishVersionReload,
  VERSION_RELOAD_ATTRIBUTE,
  VERSION_RELOAD_BOOTSTRAP_SCRIPT,
  VERSION_RELOAD_KEY,
  VERSION_RELOAD_LOCALE_ATTRIBUTE,
} from "@/components/version-update/versionReload";

beforeEach(() => {
  jest.useFakeTimers();
  sessionStorage.clear();
  finishVersionReload();
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["fr-FR"],
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  finishVersionReload();
  jest.useRealTimers();
});

it("shows localized feedback before reloading and ignores repeat taps", () => {
  const reload = jest.fn();
  beginVersionReload(reload);
  beginVersionReload(reload);
  expect(document.documentElement).toHaveAttribute(
    VERSION_RELOAD_ATTRIBUTE,
    "true"
  );
  expect(document.documentElement).toHaveAttribute(
    VERSION_RELOAD_LOCALE_ATTRIBUTE,
    "fr-FR"
  );
  expect(reload).not.toHaveBeenCalled();
  expect(JSON.parse(sessionStorage.getItem(VERSION_RELOAD_KEY)!)).toMatchObject(
    { locale: "fr-FR" }
  );
  jest.advanceTimersByTime(160);
  expect(reload).toHaveBeenCalledTimes(1);
});

it("restores feedback in the next document and consumes the marker", () => {
  sessionStorage.setItem(
    VERSION_RELOAD_KEY,
    JSON.stringify({ at: Date.now(), locale: "de-DE" })
  );
  globalThis.eval(VERSION_RELOAD_BOOTSTRAP_SCRIPT);
  expect(document.documentElement).toHaveAttribute(
    VERSION_RELOAD_LOCALE_ATTRIBUTE,
    "de-DE"
  );
  expect(document.documentElement).toHaveAttribute(VERSION_RELOAD_ATTRIBUTE);
  expect(sessionStorage.getItem(VERSION_RELOAD_KEY)).toBeNull();
  finishVersionReload();
  expect(document.documentElement).not.toHaveAttribute(
    VERSION_RELOAD_ATTRIBUTE
  );
});

it.each([
  null,
  "invalid",
  JSON.stringify({ at: 0 }),
  JSON.stringify({ at: "bad" }),
])("does not cover normal loads or invalid markers: %s", (raw) => {
  if (raw !== null) sessionStorage.setItem(VERSION_RELOAD_KEY, raw);
  globalThis.eval(VERSION_RELOAD_BOOTSTRAP_SCRIPT);
  expect(document.documentElement).not.toHaveAttribute(
    VERSION_RELOAD_ATTRIBUTE
  );
});

it("uncovers the page if hydration never completes", () => {
  sessionStorage.setItem(
    VERSION_RELOAD_KEY,
    JSON.stringify({ at: Date.now(), locale: "en-US" })
  );
  globalThis.eval(VERSION_RELOAD_BOOTSTRAP_SCRIPT);
  jest.advanceTimersByTime(30_000);
  expect(document.documentElement).not.toHaveAttribute(
    VERSION_RELOAD_ATTRIBUTE
  );
});

it("still reloads if storage is blocked", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const reload = jest.fn();
  beginVersionReload(reload);
  jest.advanceTimersByTime(160);
  expect(reload).toHaveBeenCalledTimes(1);
});
