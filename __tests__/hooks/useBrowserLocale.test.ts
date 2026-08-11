import { renderHook, waitFor } from "@testing-library/react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";

const originalLanguagesDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  "languages"
);
const originalLanguageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  "language"
);

const setNavigatorValue = (
  property: "language" | "languages",
  value: string | readonly string[] | undefined
) => {
  Object.defineProperty(globalThis.navigator, property, {
    configurable: true,
    value,
  });
};

const restoreNavigatorProperty = (
  property: "language" | "languages",
  descriptor: PropertyDescriptor | undefined
) => {
  if (descriptor) {
    Object.defineProperty(globalThis.navigator, property, descriptor);
  } else {
    Reflect.deleteProperty(globalThis.navigator, property);
  }
};

describe("useBrowserLocale", () => {
  afterEach(() => {
    restoreNavigatorProperty("languages", originalLanguagesDescriptor);
    restoreNavigatorProperty("language", originalLanguageDescriptor);
  });

  it("uses the first supported browser locale", async () => {
    setNavigatorValue("languages", ["fr-FR", "en-US"]);
    setNavigatorValue("language", "en-US");

    const { result } = renderHook(() => useBrowserLocale());

    await waitFor(() => {
      expect(result.current).toBe("fr-FR");
    });
  });

  it("falls back to navigator.language when languages is unavailable", async () => {
    setNavigatorValue("languages", undefined);
    setNavigatorValue("language", "de-DE");

    const { result } = renderHook(() => useBrowserLocale());

    await waitFor(() => {
      expect(result.current).toBe("de-DE");
    });
  });

  it("falls back to en-US when browser locale data is malformed", async () => {
    setNavigatorValue("languages", undefined);
    setNavigatorValue("language", undefined);

    const { result } = renderHook(() => useBrowserLocale());

    await waitFor(() => {
      expect(result.current).toBe("en-US");
    });
  });

  it("falls back to en-US when the browser locale is unsupported", async () => {
    setNavigatorValue("languages", ["xx-XX"]);
    setNavigatorValue("language", "xx-XX");

    const { result } = renderHook(() => useBrowserLocale());

    await waitFor(() => {
      expect(result.current).toBe("en-US");
    });
  });
});
