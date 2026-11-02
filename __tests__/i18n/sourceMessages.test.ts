import path from "node:path";
import { waitFor } from "@testing-library/react";
import type { PublicEnv } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import {
  getSourceMessage,
  registerSourceMessages,
} from "@/i18n/messageRegistry";
import { EN_US_ROOT_MESSAGES } from "@/i18n/messages/en-US";
import {
  EN_US_MESSAGES,
  type MessageKey,
} from "@/i18n/messages/en-US.complete";
import * as serverSourceMessages from "@/i18n/sourceMessages";
import * as browserSourceMessages from "@/i18n/sourceMessages.browser";

type SourceMessagesModule = typeof serverSourceMessages;
type MessagesModule = typeof import("@/i18n/messages");
type RegistryModule = typeof import("@/i18n/messageRegistry");
type CompleteDictionaryModule = typeof import("@/i18n/messages/en-US.complete");

const BROWSER_MODULE = "@/i18n/sourceMessages.browser";
const COMPLETE_MODULE = "@/i18n/messages/en-US.complete";
const ROOT_KEY = "waves.sidebar.allWaves";
const POSTING_KEY = "waves.header.postLabel.inProgress";
// Stands in for a key from a namespace this bundle never imported.
const UNREGISTERED_KEY = "test.unregistered.title" as MessageKey;
const publicEnv = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
} as PublicEnv;

// The browser variant must stay a drop-in replacement for the server module.
const browserModuleContract: SourceMessagesModule = browserSourceMessages;

// Evaluate the browser modules from scratch, as a fresh page load would,
// resolving `@/i18n/sourceMessages` the way the Turbopack alias does.
function loadBrowserModules(): {
  readonly messages: MessagesModule;
  readonly registry: RegistryModule;
} {
  let messages: MessagesModule | undefined;
  let registry: RegistryModule | undefined;
  jest.isolateModules(() => {
    jest.doMock("@/i18n/sourceMessages", () =>
      jest.requireActual<SourceMessagesModule>(BROWSER_MODULE)
    );
    registry = jest.requireActual<RegistryModule>("@/i18n/messageRegistry");
    messages = jest.requireActual<MessagesModule>("@/i18n/messages");
  });
  if (!messages || !registry) {
    throw new Error("Browser i18n modules did not load");
  }
  return { messages, registry };
}

function mockCompleteDictionary(extraMessages: Record<string, string>) {
  jest.doMock(COMPLETE_MODULE, () => {
    const actual =
      jest.requireActual<CompleteDictionaryModule>(COMPLETE_MODULE);
    return {
      ...actual,
      EN_US_MESSAGES: { ...actual.EN_US_MESSAGES, ...extraMessages },
    };
  });
}

let consoleError: jest.SpyInstance;

beforeEach(() => {
  consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  jest.dontMock("@/i18n/sourceMessages");
  jest.dontMock(COMPLETE_MODULE);
});

describe("source message registry", () => {
  it("returns the copy of a registered dictionary", () => {
    const namespace = registerSourceMessages({
      "test.registry.title": "Registered title",
    });

    expect(registerSourceMessages(namespace)).toBe(namespace);
    expect(getSourceMessage("test.registry.title")).toBe("Registered title");
    expect(getSourceMessage("test.registry.missing")).toBeUndefined();
  });

  it("ignores properties a dictionary inherits", () => {
    expect(getSourceMessage("constructor")).toBeUndefined();
    expect(getSourceMessage("__proto__")).toBeUndefined();
    expect(getSourceMessage("toString")).toBeUndefined();
  });
});

describe("server source messages", () => {
  it("registers every message of the complete en-US dictionary", () => {
    const unresolved = Object.entries(EN_US_MESSAGES).filter(
      ([key, message]) => getSourceMessage(key) !== message
    );

    expect(unresolved).toEqual([]);
  });

  it("keeps every root message in the complete dictionary", () => {
    const changed = Object.entries(EN_US_ROOT_MESSAGES).filter(
      ([key, message]) =>
        (EN_US_MESSAGES as Readonly<Record<string, string>>)[key] !== message
    );

    expect(changed).toEqual([]);
  });

  it("throws for a key that no dictionary defines", () => {
    expect(() =>
      serverSourceMessages.resolveMissingSourceMessage(UNREGISTERED_KEY)
    ).toThrow(`Missing source message for key: ${UNREGISTERED_KEY}`);
  });

  it("is replaced by the browser module only in Turbopack browser bundles", () => {
    const browserAlias = sharedConfig(publicEnv, "").turbopack?.resolveAlias?.[
      "@/i18n/sourceMessages"
    ];

    expect(browserAlias).toEqual({
      browser: "./i18n/sourceMessages.browser.ts",
    });
    expect(path.resolve("i18n/sourceMessages.browser.ts")).toBe(
      require.resolve(BROWSER_MODULE)
    );
    expect(Object.keys(browserModuleContract).sort()).toEqual(
      Object.keys(serverSourceMessages).sort()
    );
  });
});

describe("browser source messages", () => {
  it("renders root copy and locale fallbacks from the root dictionary", () => {
    const { messages } = loadBrowserModules();

    expect(messages.t("en-US", ROOT_KEY)).toBe("All Waves");
    expect(messages.t("de-DE", POSTING_KEY)).toBe("Posting");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("renders a namespace's copy once the namespace registers", () => {
    const { messages, registry } = loadBrowserModules();

    registry.registerSourceMessages({ [UNREGISTERED_KEY]: "Namespace title" });

    expect(messages.t("en-US", UNREGISTERED_KEY)).toBe("Namespace title");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("reports an unregistered key once, renders no text and loads the complete dictionary", async () => {
    mockCompleteDictionary({ [UNREGISTERED_KEY]: "Complete title" });
    const { messages } = loadBrowserModules();

    expect(messages.t("en-US", UNREGISTERED_KEY)).toBe("");
    expect(messages.tRich("en-US", UNREGISTERED_KEY, {})).toEqual([]);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(`"${UNREGISTERED_KEY}"`)
    );

    await waitFor(() => {
      expect(messages.t("en-US", UNREGISTERED_KEY)).toBe("Complete title");
    });
    expect(consoleError).toHaveBeenCalledTimes(1);
  });

  it("asks for the complete dictionary again after its chunk fails", async () => {
    let attempts = 0;
    jest.doMock(COMPLETE_MODULE, () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("chunk request failed");
      }
      const actual =
        jest.requireActual<CompleteDictionaryModule>(COMPLETE_MODULE);
      return {
        ...actual,
        EN_US_MESSAGES: {
          ...actual.EN_US_MESSAGES,
          [UNREGISTERED_KEY]: "Complete title",
        },
      };
    });
    const { messages } = loadBrowserModules();

    expect(messages.t("en-US", UNREGISTERED_KEY)).toBe("");
    // A miss while the first load is pending does not ask again; one after it
    // failed does.
    await waitFor(() => {
      messages.t("en-US", UNREGISTERED_KEY);
      expect(attempts).toBe(2);
    });
    await waitFor(() => {
      expect(messages.t("en-US", UNREGISTERED_KEY)).toBe("Complete title");
    });
    expect(attempts).toBe(2);
    expect(consoleError).toHaveBeenCalledTimes(1);
  });
});
