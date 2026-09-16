import {
  beginVersionReload,
  finishVersionReloadWhenReady,
  prepareVersionReloadImage,
  VERSION_RELOAD_ATTRIBUTE,
  VERSION_RELOAD_BOOTSTRAP_SCRIPT,
  VERSION_RELOAD_KEY,
  VERSION_RELOAD_LOCALE_ATTRIBUTE,
  VERSION_RELOAD_SCREEN_ID,
} from "@/components/version-update/versionReload";

beforeEach(() => {
  jest.useFakeTimers();
  sessionStorage.clear();
  Object.defineProperty(navigator, "languages", {
    configurable: true,
    value: ["fr-FR"],
  });
});
afterEach(async () => {
  await jest.advanceTimersByTimeAsync(30_000);
  jest.restoreAllMocks();
  document.documentElement.removeAttribute(VERSION_RELOAD_ATTRIBUTE);
  document.documentElement.removeAttribute(VERSION_RELOAD_LOCALE_ATTRIBUTE);
  document.body.replaceChildren();
  document.head
    .querySelectorAll('link[rel="preload"]')
    .forEach((link) => link.remove());
  jest.useRealTimers();
});

it("shows localized feedback before reloading and ignores repeat taps", async () => {
  const reload = jest.fn();
  beginVersionReload(reload);
  beginVersionReload(reload);
  await jest.advanceTimersByTimeAsync(0);
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
  await jest.advanceTimersByTimeAsync(160);
  expect(reload).toHaveBeenCalledTimes(1);
});

it("restores feedback in the next document and consumes the marker", async () => {
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
  finishVersionReloadWhenReady();
  await jest.advanceTimersByTimeAsync(160);
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

it("still reloads if storage is blocked", async () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const reload = jest.fn();
  beginVersionReload(reload);
  await jest.advanceTimersByTimeAsync(0);
  await jest.advanceTimersByTimeAsync(160);
  expect(reload).toHaveBeenCalledTimes(1);
});

function mountRocket(decode: () => Promise<void>) {
  const cover = document.createElement("div");
  cover.id = VERSION_RELOAD_SCREEN_ID;
  const image = document.createElement("img");
  image.src = "/rocket-refresh-small.png";
  image.decode = decode;
  cover.append(image);
  document.body.append(cover);
  return image;
}

it("prepares the rocket without displaying the cover or reloading", async () => {
  const decode = jest.fn().mockResolvedValue(undefined);
  mountRocket(decode);
  await prepareVersionReloadImage();
  expect(decode).toHaveBeenCalledTimes(1);
  expect(document.documentElement).not.toHaveAttribute(
    VERSION_RELOAD_ATTRIBUTE
  );
  expect(sessionStorage.getItem(VERSION_RELOAD_KEY)).toBeNull();
});

it("waits for the rocket before showing the outgoing cover, including repeat taps", async () => {
  let completeDecode = () => {};
  const decode = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        completeDecode = resolve;
      })
  );
  mountRocket(decode);
  const reload = jest.fn();
  beginVersionReload(reload);
  beginVersionReload(reload);
  await jest.advanceTimersByTimeAsync(200);
  expect(reload).not.toHaveBeenCalled();
  expect(document.documentElement).not.toHaveAttribute(
    VERSION_RELOAD_ATTRIBUTE
  );
  expect(decode).toHaveBeenCalledTimes(1);

  completeDecode();
  await jest.advanceTimersByTimeAsync(0);
  expect(document.documentElement).toHaveAttribute(VERSION_RELOAD_ATTRIBUTE);
  expect(reload).not.toHaveBeenCalled();
  finishVersionReloadWhenReady();
  await jest.advanceTimersByTimeAsync(160);
  expect(reload).toHaveBeenCalledTimes(1);
  expect(document.documentElement).toHaveAttribute(VERSION_RELOAD_ATTRIBUTE);
});

it("keeps the incoming cover intact until its inline rocket can paint", async () => {
  let completeDecode = () => {};
  const image = mountRocket(
    () =>
      new Promise<void>((resolve) => {
        completeDecode = resolve;
      })
  );
  sessionStorage.setItem(
    VERSION_RELOAD_KEY,
    JSON.stringify({ at: Date.now(), locale: "en-US" })
  );
  globalThis.eval(VERSION_RELOAD_BOOTSTRAP_SCRIPT);
  expect(
    document.head.querySelector('link[rel="preload"][as="image"]')
  ).toBeNull();
  finishVersionReloadWhenReady();
  await jest.advanceTimersByTimeAsync(200);
  expect(document.documentElement).toHaveAttribute(VERSION_RELOAD_ATTRIBUTE);
  expect(image.isConnected).toBe(true);
  completeDecode();
  await jest.advanceTimersByTimeAsync(0);
  expect(document.documentElement).toHaveAttribute(VERSION_RELOAD_ATTRIBUTE);
  await jest.advanceTimersByTimeAsync(160);
  expect(document.documentElement).not.toHaveAttribute(
    VERSION_RELOAD_ATTRIBUTE
  );
  expect(image.isConnected).toBe(true);
});

it.each(["rejects", "stalls"])(
  "still reloads when image decoding %s",
  async (failure) => {
    mountRocket(() =>
      failure === "rejects"
        ? Promise.reject(new Error("image unavailable"))
        : new Promise(() => {})
    );
    const reload = jest.fn();
    beginVersionReload(reload);
    await jest.advanceTimersByTimeAsync(1_200);
    expect(reload).toHaveBeenCalledTimes(1);
  }
);

it("uses the navigation fallback when animation frames are suspended", async () => {
  jest.spyOn(globalThis, "requestAnimationFrame").mockReturnValue(1);
  const reload = jest.fn();
  beginVersionReload(reload);
  await jest.advanceTimersByTimeAsync(160);
  expect(reload).toHaveBeenCalledTimes(1);
});
