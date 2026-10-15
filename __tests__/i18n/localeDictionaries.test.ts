import path from "node:path";
import { waitFor } from "@testing-library/react";
import type { PublicEnv } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import * as serverDictionaries from "@/i18n/localeDictionaries";
import * as browserDictionaries from "@/i18n/localeDictionaries.browser";

type LocaleDictionariesModule = typeof serverDictionaries;
type MessagesModule = typeof import("@/i18n/messages");

const POSTING_KEY = "waves.header.postLabel.inProgress";
const publicEnv = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
} as PublicEnv;
const BROWSER_MODULE = "@/i18n/localeDictionaries.browser";

// The browser variant must stay a drop-in replacement for the server module.
const browserModuleContract: LocaleDictionariesModule = browserDictionaries;

const originalLanguagesDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  "languages"
);

// Evaluate the browser modules from scratch, as a fresh page load would,
// resolving `@/i18n/localeDictionaries` the way the Turbopack alias does.
function loadBrowserModules(): {
  readonly dictionaries: LocaleDictionariesModule;
  readonly messages: MessagesModule;
} {
  let dictionaries: LocaleDictionariesModule | undefined;
  let messages: MessagesModule | undefined;
  jest.isolateModules(() => {
    jest.doMock("@/i18n/localeDictionaries", () =>
      jest.requireActual<LocaleDictionariesModule>(BROWSER_MODULE)
    );
    dictionaries = jest.requireActual<LocaleDictionariesModule>(BROWSER_MODULE);
    messages = jest.requireActual<MessagesModule>("@/i18n/messages");
  });
  if (!dictionaries || !messages) {
    throw new Error("Browser i18n modules did not load");
  }
  return { dictionaries, messages };
}

function setBrowserLanguages(languages: readonly string[]) {
  Object.defineProperty(globalThis.navigator, "languages", {
    configurable: true,
    value: languages,
  });
}

afterEach(() => {
  globalThis.history.replaceState(null, "", "/");
  if (originalLanguagesDescriptor) {
    Object.defineProperty(
      globalThis.navigator,
      "languages",
      originalLanguagesDescriptor
    );
  } else {
    Reflect.deleteProperty(globalThis.navigator, "languages");
  }
  jest.dontMock("@/i18n/localeDictionaries");
  jest.dontMock("@/i18n/messages/es-ES");
  jest.dontMock("@/i18n/messages/de-DE");
});

describe("server locale dictionaries", () => {
  it("serves every non-default dictionary synchronously", async () => {
    expect(serverDictionaries.getLocaleDictionary("de-DE")).toEqual(
      expect.objectContaining({ [POSTING_KEY]: "Beitrag wird veröffentlicht" })
    );
    await expect(
      serverDictionaries.loadLocaleDictionary("fr-FR")
    ).resolves.toBe(serverDictionaries.getLocaleDictionary("fr-FR"));
    expect(serverDictionaries.getPendingRouteLocaleLoad()).toBeNull();
  });

  it("is replaced by the browser module only in Turbopack browser bundles", () => {
    const browserAlias = sharedConfig(publicEnv, "").turbopack?.resolveAlias?.[
      "@/i18n/localeDictionaries"
    ];

    expect(browserAlias).toEqual({
      browser: "./i18n/localeDictionaries.browser.ts",
    });
    expect(path.resolve("i18n/localeDictionaries.browser.ts")).toBe(
      require.resolve(BROWSER_MODULE)
    );
    expect(Object.keys(browserModuleContract).sort()).toEqual(
      Object.keys(serverDictionaries).sort()
    );
  });
});

describe("browser locale dictionaries", () => {
  it("renders en-US copy until a non-default dictionary loads", async () => {
    const { messages } = loadBrowserModules();

    expect(messages.hasLocaleMessages("en-US")).toBe(true);
    expect(messages.hasLocaleMessages("de-DE")).toBe(false);
    expect(messages.t("de-DE", POSTING_KEY)).toBe("Posting");

    await messages.loadLocaleMessages("de-DE");

    expect(messages.hasLocaleMessages("de-DE")).toBe(true);
    expect(messages.t("de-DE", POSTING_KEY)).toBe(
      "Beitrag wird veröffentlicht"
    );
  });

  it("requests each dictionary once", async () => {
    const { dictionaries } = loadBrowserModules();

    const firstLoad = dictionaries.loadLocaleDictionary("fr-FR");
    expect(dictionaries.loadLocaleDictionary("fr-FR")).toBe(firstLoad);
    await expect(firstLoad).resolves.toEqual(
      expect.objectContaining({ [POSTING_KEY]: "Publication en cours" })
    );
    expect(dictionaries.getLocaleDictionary("fr-FR")).toBe(await firstLoad);
  });

  it("retries a dictionary whose chunk failed to load", async () => {
    let attempts = 0;
    jest.doMock("@/i18n/messages/es-ES", () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("chunk request failed");
      }
      return jest.requireActual<typeof import("@/i18n/messages/es-ES")>(
        "@/i18n/messages/es-ES"
      );
    });
    const { dictionaries, messages } = loadBrowserModules();

    await expect(dictionaries.loadLocaleDictionary("es-ES")).rejects.toThrow(
      "chunk request failed"
    );
    expect(messages.t("es-ES", POSTING_KEY)).toBe("Posting");

    await expect(dictionaries.loadLocaleDictionary("es-ES")).resolves.toEqual(
      expect.objectContaining({ [POSTING_KEY]: "Publicando" })
    );
    expect(messages.t("es-ES", POSTING_KEY)).toBe("Publicando");
  });

  it("starts the ?locale= dictionary at page load and holds hydration until it arrives", async () => {
    globalThis.history.replaceState(null, "", "/the-memes?locale=fr-FR");
    const { dictionaries } = loadBrowserModules();

    const pendingLoad = dictionaries.getPendingRouteLocaleLoad();
    expect(pendingLoad).not.toBeNull();
    expect(dictionaries.getLocaleDictionary("fr-FR")).toBeUndefined();

    await pendingLoad;

    expect(dictionaries.getLocaleDictionary("fr-FR")).toBeDefined();
    expect(dictionaries.getPendingRouteLocaleLoad()).toBeNull();
  });

  it("stops holding hydration when the ?locale= dictionary fails to load", async () => {
    // de-DE: no other test mocks it, so Jest has no cached mock module.
    globalThis.history.replaceState(null, "", "/the-memes?locale=de-DE");
    jest.doMock("@/i18n/messages/de-DE", () => {
      throw new Error("chunk request failed");
    });
    const { dictionaries, messages } = loadBrowserModules();

    const pendingLoad = dictionaries.getPendingRouteLocaleLoad();
    expect(pendingLoad).not.toBeNull();
    await pendingLoad;

    expect(dictionaries.getPendingRouteLocaleLoad()).toBeNull();
    expect(messages.t("de-DE", POSTING_KEY)).toBe("Posting");
  });

  it.each(["/the-memes", "/the-memes?locale=en-US", "/the-memes?locale=xx-XX"])(
    "never holds hydration for %s",
    (url) => {
      globalThis.history.replaceState(null, "", url);
      const { dictionaries } = loadBrowserModules();

      expect(dictionaries.getPendingRouteLocaleLoad()).toBeNull();
    }
  );

  it("preloads the browser's preferred locale at page load", async () => {
    setBrowserLanguages(["es-ES", "en-US"]);
    const { dictionaries } = loadBrowserModules();

    await waitFor(() => {
      expect(dictionaries.getLocaleDictionary("es-ES")).toBeDefined();
    });
    expect(dictionaries.getLocaleDictionary("de-DE")).toBeUndefined();
  });
});
