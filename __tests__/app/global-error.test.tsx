import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

import GlobalError from "@/app/global-error";
import { publicEnv } from "@/config/env";
import { t, type MessageKey } from "@/i18n/messages";
import { GLOBAL_ERROR_MESSAGES } from "@/i18n/messages/global-error";

const captureExceptionMock = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

const originalSentryDsn = publicEnv.SENTRY_DSN;
const originalLanguagesDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  "languages"
);
const originalLanguageDescriptor = Object.getOwnPropertyDescriptor(
  globalThis.navigator,
  "language"
);

const setNavigatorLanguages = (languages: readonly string[] | undefined) => {
  Object.defineProperty(globalThis.navigator, "languages", {
    configurable: true,
    value: languages,
  });
  Object.defineProperty(globalThis.navigator, "language", {
    configurable: true,
    value: languages?.[0],
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

const createError = (message = "Root layout exploded", digest?: string) => {
  const error: Error & { digest?: string | undefined } = new Error(message);
  error.stack = `Error: ${message}\n    at RootLayout (layout.tsx:1:1)`;
  if (digest) {
    error.digest = digest;
  }
  return error;
};

// GlobalError owns <html>/<body>, so it is rendered into the document itself,
// with no provider wrapper of any kind.
// By default it renders the 16.3 prop shape; pass retryProps to render another.
const renderGlobalError = ({
  error = createError(),
  retryProps,
}: {
  readonly error?: Error & { digest?: string | undefined };
  readonly retryProps?: Partial<Parameters<typeof GlobalError>[0]>;
} = {}) => {
  const retry = jest.fn();
  const reset = jest.fn();
  const result = render(
    <GlobalError error={error} retry={retry} reset={reset} {...retryProps} />,
    { container: document as unknown as HTMLElement }
  );
  return { ...result, retry, reset };
};

// Stand-in for the server-rendered document the browser parsed before
// hydrating: copy its <html> attributes and <head>/<body> children into the
// live jsdom document without writing HTML through document.write or
// innerHTML.
const loadServerDocument = (serverHtml: string) => {
  const serverDocument = new DOMParser().parseFromString(
    serverHtml,
    "text/html"
  );
  const importChildren = (parent: HTMLElement) =>
    Array.from(parent.childNodes, (node) => document.importNode(node, true));

  for (const { name, value } of Array.from(
    serverDocument.documentElement.attributes
  )) {
    document.documentElement.setAttribute(name, value);
  }
  document.head.replaceChildren(...importChildren(serverDocument.head));
  document.body.replaceChildren(...importChildren(serverDocument.body));
};

const resetDocument = () => {
  document.documentElement.removeAttribute("lang");
  document.head.replaceChildren();
  document.body.replaceChildren();
};

describe("GlobalError", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    captureExceptionMock.mockClear();
    publicEnv.SENTRY_DSN = undefined;
    setNavigatorLanguages(["en-US"]);
    // extractErrorDetails logs the full error outside production.
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    publicEnv.SENTRY_DSN = originalSentryDsn;
    restoreNavigatorProperty("languages", originalLanguagesDescriptor);
    restoreNavigatorProperty("language", originalLanguageDescriptor);
  });

  it("renders the heading, recovery actions and support contact without any provider", () => {
    renderGlobalError();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Welcome to the 6529 Page of Doom",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try Again" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Go to the 6529 home page" })
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: "support@6529.io" })
    ).toHaveAttribute("href", "mailto:support@6529.io");
    expect(document.title).toBe("6529 Error");
    expect(document.documentElement).toHaveAttribute("lang", "en-US");
  });

  it("renders without React warnings", () => {
    renderGlobalError({ error: createError("Boom", "abc123") });

    // extractErrorDetails logs the raw error outside production; anything else
    // on console.error would be a React warning (nesting, keys, attributes).
    const unexpected = consoleErrorSpy.mock.calls.filter(
      ([message]) => !String(message).startsWith("[GLOBAL_ERROR]")
    );
    expect(unexpected).toEqual([]);
  });

  it("server-renders the en-US document without touching browser APIs", () => {
    const html = renderToString(
      <GlobalError
        error={createError("Boom", "abc123")}
        retry={jest.fn()}
        reset={jest.fn()}
      />
    );

    expect(html).toContain('<html lang="en-US">');
    expect(html).toContain("Welcome to the 6529 Page of Doom");
    expect(html).toContain("Try Again");
    expect(html).toContain("<title>6529 Error</title>");
    // Entities inside <style> are not decoded by browsers, so the stylesheet
    // must not contain characters React would escape on the server.
    const styleStart = html.indexOf("<style>") + "<style>".length;
    const serverStyles = html.slice(styleStart, html.indexOf("</style>"));
    expect(serverStyles).toContain(".global-error__retry");
    expect(serverStyles).not.toMatch(/&(?:quot|amp|lt|gt|#x27);/);
  });

  it("retries with Next 16.3 `retry` from the Try Again button", () => {
    const { retry, reset } = renderGlobalError();

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

    expect(retry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });

  it("retries with Next 16.2 `unstable_retry` when `retry` is absent", () => {
    const unstableRetry = jest.fn();
    const reset = jest.fn();
    renderGlobalError({
      retryProps: { retry: undefined, unstable_retry: unstableRetry, reset },
    });

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

    expect(unstableRetry).toHaveBeenCalledTimes(1);
    expect(reset).not.toHaveBeenCalled();
  });

  it("falls back to `reset` when no retry function is provided", () => {
    const reset = jest.fn();
    renderGlobalError({ retryProps: { retry: undefined, reset } });

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("brings its own styles instead of relying on the app stylesheet", () => {
    renderGlobalError();

    const styleText = Array.from(document.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");
    expect(styleText).toContain(".global-error__retry");
    expect(styleText).toContain(":focus-visible");
  });

  it("exposes the digest and stack trace in a native disclosure", () => {
    renderGlobalError({ error: createError("Boom", "abc123") });

    const summary = screen.getByText("Error details");
    expect(summary.tagName).toBe("SUMMARY");
    const trace = screen.getByText(/Error ID: abc123/);
    expect(trace.tagName).toBe("PRE");
    expect(trace).toHaveTextContent("RootLayout (layout.tsx:1:1)");
    expect(trace).not.toHaveAttribute("tabindex");
  });

  it("renders without an error ID when the error has no digest", () => {
    renderGlobalError({ error: createError("Boom") });

    expect(screen.getByText(/at RootLayout/)).not.toHaveTextContent("Error ID");
  });

  it("does not report to Sentry when no DSN is configured", () => {
    renderGlobalError();

    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("reports the error to Sentry when a DSN is configured", () => {
    publicEnv.SENTRY_DSN = "https://public@example.ingest.sentry.io/1";
    const error = createError();

    renderGlobalError({ error });

    expect(captureExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureExceptionMock).toHaveBeenCalledWith(error);
  });

  it("uses the browser locale for its copy and document language", async () => {
    setNavigatorLanguages(["fr-FR", "en-US"]);

    renderGlobalError();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Bienvenue sur la Page de la Fatalité de 6529",
        })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: "Réessayer" })
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "fr-FR");
    expect(document.title).toBe("6529 Erreur");
  });

  it("falls back to en-US when the browser locale is unsupported", async () => {
    setNavigatorLanguages(["xx-XX"]);

    renderGlobalError();

    await act(async () => undefined);
    expect(
      screen.getByRole("button", { name: "Try Again" })
    ).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en-US");
  });

  it("resolves an en-GB browser to the en-US copy, never to raw message keys", async () => {
    setNavigatorLanguages(["en-GB"]);

    renderGlobalError();

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "en-GB");
    });
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Welcome to the 6529 Page of Doom",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try Again" })
    ).toBeInTheDocument();
    expect(document.title).toBe("6529 Error");
    expect(document.body.textContent).not.toContain("globalError.");
  });

  it.each(Object.entries(GLOBAL_ERROR_MESSAGES))(
    "t() resolves %s for en-GB to the en-US copy",
    (key, enUsCopy) => {
      const resolved = t("en-GB", key as MessageKey);

      expect(resolved).toBe(enUsCopy);
      expect(resolved).not.toBe(key);
    }
  );

  it("hydrates server markup, then follows browser locale changes without warnings", async () => {
    const props = {
      error: createError("Boom", "abc123"),
      retry: jest.fn(),
      reset: jest.fn(),
    };
    // Server output is always the en-US document, whatever the browser prefers.
    const serverHtml = renderToString(<GlobalError {...props} />);
    loadServerDocument(serverHtml);
    setNavigatorLanguages(["fr-FR"]);

    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(document, <GlobalError {...props} />);
      });

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute("lang", "fr-FR");
      });
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Bienvenue sur la Page de la Fatalité de 6529",
        })
      ).toBeInTheDocument();

      // The browser language changes after mount.
      setNavigatorLanguages(["de-DE"]);
      await act(async () => {
        globalThis.dispatchEvent(new Event("languagechange"));
      });

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute("lang", "de-DE");
      });
      expect(
        screen.getByRole("heading", {
          level: 1,
          name: "Willkommen auf der 6529-Seite des Verderbens",
        })
      ).toBeInTheDocument();
      expect(document.title).toBe("6529 Fehler");

      // extractErrorDetails logs the raw error; anything else on console.error
      // would be a React hydration or update warning.
      const unexpected = consoleErrorSpy.mock.calls.filter(
        ([message]) => !String(message).startsWith("[GLOBAL_ERROR]")
      );
      expect(unexpected).toEqual([]);
    } finally {
      act(() => root?.unmount());
      resetDocument();
    }
  });
});
