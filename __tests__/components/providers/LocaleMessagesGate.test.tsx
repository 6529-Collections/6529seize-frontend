import { act } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import LocaleMessagesGate from "@/components/providers/LocaleMessagesGate";
import { t } from "@/i18n/messages";

const POSTING_KEY = "waves.header.postLabel.inProgress";
const FRENCH_POSTING_LABEL = "Publication en cours";

// Simulate one `?locale=fr-FR` page load: every dictionary is available on the
// server, and the browser receives fr-FR only when `mockRouteLocale` resolves.
const mockRouteLocale: {
  loaded: boolean;
  pendingLoad: Promise<void> | null;
} = { loaded: true, pendingLoad: null };

jest.mock("@/i18n/localeDictionaries", () => {
  const actual = jest.requireActual<typeof import("@/i18n/localeDictionaries")>(
    "@/i18n/localeDictionaries"
  );
  return {
    ...actual,
    getLocaleDictionary: (
      locale: Parameters<typeof actual.getLocaleDictionary>[0]
    ) =>
      mockRouteLocale.loaded ? actual.getLocaleDictionary(locale) : undefined,
    getPendingRouteLocaleLoad: () =>
      mockRouteLocale.loaded ? null : mockRouteLocale.pendingLoad,
  };
});

function PostingLabel({ onHydrated }: { readonly onHydrated: () => void }) {
  useEffect(() => {
    onHydrated();
  }, [onHydrated]);
  return <span>{t("fr-FR", POSTING_KEY)}</span>;
}

function renderServerMarkup(children: ReactNode): HTMLDivElement {
  mockRouteLocale.loaded = true;
  mockRouteLocale.pendingLoad = null;
  const container = document.createElement("div");
  container.innerHTML = renderToString(children);
  document.body.appendChild(container);
  return container;
}

function startBrowserRouteLocaleLoad(): () => void {
  let finishLoad: () => void = () => undefined;
  mockRouteLocale.loaded = false;
  mockRouteLocale.pendingLoad = new Promise<void>((resolve) => {
    finishLoad = () => {
      mockRouteLocale.loaded = true;
      resolve();
    };
  });
  return () => finishLoad();
}

describe("LocaleMessagesGate", () => {
  let root: Root | undefined;
  let container: HTMLDivElement | undefined;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    consoleError.mockRestore();
  });

  it("renders server markup in the requested locale without waiting", () => {
    expect(
      renderToString(
        <LocaleMessagesGate>
          <span>{t("fr-FR", POSTING_KEY)}</span>
        </LocaleMessagesGate>
      )
    ).toBe(`<span>${FRENCH_POSTING_LABEL}</span>`);
  });

  it("hydrates a ?locale= page only after its dictionary loads", async () => {
    const onHydrated = jest.fn();
    const onRecoverableError = jest.fn();
    const tree = (
      <LocaleMessagesGate>
        <PostingLabel onHydrated={onHydrated} />
      </LocaleMessagesGate>
    );
    const serverMarkup = renderServerMarkup(tree);
    container = serverMarkup;
    const finishLoad = startBrowserRouteLocaleLoad();

    await act(async () => {
      root = hydrateRoot(serverMarkup, tree, { onRecoverableError });
    });

    expect(onHydrated).not.toHaveBeenCalled();
    expect(serverMarkup).toHaveTextContent(FRENCH_POSTING_LABEL);

    await act(async () => {
      finishLoad();
    });

    expect(onHydrated).toHaveBeenCalledTimes(1);
    expect(serverMarkup).toHaveTextContent(FRENCH_POSTING_LABEL);
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("would otherwise hydrate en-US fallback copy over the server markup", async () => {
    const onRecoverableError = jest.fn();
    const tree = <PostingLabel onHydrated={() => undefined} />;
    const serverMarkup = renderServerMarkup(tree);
    container = serverMarkup;
    startBrowserRouteLocaleLoad();

    await act(async () => {
      root = hydrateRoot(serverMarkup, tree, { onRecoverableError });
    });

    expect(onRecoverableError).toHaveBeenCalled();
    expect(serverMarkup).toHaveTextContent("Posting");
  });
});
