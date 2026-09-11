import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
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

  it("hydrates with the SSR locale before applying the browser locale", async () => {
    setNavigatorValue("languages", ["fr-FR"]);
    setNavigatorValue("language", "fr-FR");

    const Probe = () => createElement("span", null, useBrowserLocale());
    const container = document.createElement("div");
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    container.innerHTML = renderToString(createElement(Probe));
    document.body.appendChild(container);
    expect(container).toHaveTextContent("en-US");

    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, createElement(Probe));
      });

      await waitFor(() => expect(container).toHaveTextContent("fr-FR"));
      expect(consoleError.mock.calls.flat().join(" ")).not.toMatch(
        /hydration|did not match/i
      );
    } finally {
      act(() => root?.unmount());
      container.remove();
      consoleError.mockRestore();
    }
  });
});
