import { act, render, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import DocumentLanguage from "@/components/providers/DocumentLanguage";

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

const setBrowserLanguages = (languages: readonly string[]) => {
  setNavigatorValue("languages", languages);
  setNavigatorValue("language", languages[0]);
};

describe("DocumentLanguage", () => {
  beforeEach(() => {
    // The root layout declares the default locale for every server render.
    document.documentElement.lang = "en-US";
  });

  afterEach(() => {
    restoreNavigatorProperty("languages", originalLanguagesDescriptor);
    restoreNavigatorProperty("language", originalLanguageDescriptor);
    document.documentElement.removeAttribute("lang");
  });

  it("renders no markup of its own", () => {
    setBrowserLanguages(["fr-FR"]);

    const { container } = render(<DocumentLanguage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("leaves the server-declared language alone for the default locale", async () => {
    setBrowserLanguages(["en-US"]);
    const observer = new MutationObserver(() => undefined);
    observer.observe(document.documentElement, { attributes: true });

    render(<DocumentLanguage />);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "en-US");
    });
    expect(observer.takeRecords()).toHaveLength(0);
    observer.disconnect();
  });

  it.each([
    ["fr-FR", "fr-FR"],
    ["de-DE", "de-DE"],
    ["es-ES", "es-ES"],
    ["en-GB", "en-GB"],
    ["DE-de", "de-DE"],
  ])(
    "switches the document language to the browser locale %s",
    async (browserLanguage, expectedLang) => {
      setBrowserLanguages([browserLanguage]);

      render(<DocumentLanguage />);

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute("lang", expectedLang);
      });
    }
  );

  it("declares the locale the app renders when the browser language is unsupported", async () => {
    setBrowserLanguages(["ja-JP"]);

    render(<DocumentLanguage />);

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "en-US");
    });
  });

  it("follows the browser language when it changes after mount", async () => {
    setBrowserLanguages(["de-DE"]);
    render(<DocumentLanguage />);
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "de-DE");
    });

    setBrowserLanguages(["es-ES"]);
    act(() => {
      globalThis.dispatchEvent(new Event("languagechange"));
    });

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "es-ES");
    });
  });

  it("does not touch the document while rendering on the server", () => {
    setBrowserLanguages(["fr-FR"]);

    const html = renderToString(<DocumentLanguage />);

    expect(html).toBe("");
    expect(document.documentElement).toHaveAttribute("lang", "en-US");
  });
});
