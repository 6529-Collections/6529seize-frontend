import { act, renderHook, waitFor } from "@testing-library/react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { loadLocaleMessages, t } from "@/i18n/messages";

// Resolve dictionaries the way Turbopack browser bundles do.
jest.mock("@/i18n/localeDictionaries", () =>
  jest.requireActual<typeof import("@/i18n/localeDictionaries")>(
    "@/i18n/localeDictionaries.browser"
  )
);

const POSTING_KEY = "waves.header.postLabel.inProgress";

const originalLanguagesDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  "languages"
);

function setBrowserLanguages(languages: readonly string[]) {
  Object.defineProperty(globalThis.navigator, "languages", {
    configurable: true,
    value: languages,
  });
}

function renderPostingLabel() {
  const labels: string[] = [];
  const hook = renderHook(() => {
    const locale = useBrowserLocale();
    const label = t(locale, POSTING_KEY);
    labels.push(label);
    return { locale, label };
  });
  return { ...hook, labels };
}

afterEach(() => {
  if (originalLanguagesDescriptor) {
    Object.defineProperty(
      globalThis.navigator,
      "languages",
      originalLanguagesDescriptor
    );
  } else {
    Reflect.deleteProperty(globalThis.navigator, "languages");
  }
  jest.dontMock("@/i18n/messages/de-DE");
});

describe("useBrowserLocale with on-demand dictionaries", () => {
  it("keeps en-US copy until the browser locale's dictionary loads", async () => {
    setBrowserLanguages(["es-ES", "en-US"]);

    const { result, labels } = renderPostingLabel();

    await waitFor(() => {
      expect(result.current).toEqual({ locale: "es-ES", label: "Publicando" });
    });
    expect(labels[0]).toBe("Posting");
    expect(new Set(labels)).toEqual(new Set(["Posting", "Publicando"]));
  });

  it("stays on en-US when the dictionary cannot load", async () => {
    jest.doMock("@/i18n/messages/de-DE", () => {
      throw new Error("chunk request failed");
    });
    setBrowserLanguages(["de-DE"]);

    const { result } = renderPostingLabel();
    await act(async () => {
      await expect(loadLocaleMessages("de-DE")).rejects.toThrow(
        "chunk request failed"
      );
    });

    expect(result.current).toEqual({ locale: "en-US", label: "Posting" });
  });
});
