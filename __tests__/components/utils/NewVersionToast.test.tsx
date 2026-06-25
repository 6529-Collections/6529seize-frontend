import NewVersionToast from "@/components/utils/NewVersionToast";
import {
  MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE,
  MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE,
} from "@/helpers/navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/hooks/useIsVersionStale", () => ({
  useIsVersionStale: jest.fn(),
}));
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const mockedUseIsVersionStale = useIsVersionStale as jest.Mock;
const mockedUseDeviceInfo = useDeviceInfo as jest.Mock;
const NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY =
  "--new-version-toast-mobile-bottom";
const NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY =
  "--new-version-toast-mobile-scale";
const NEW_VERSION_TOAST_WEB_FALLBACK_BOTTOM = "1rem";
const NEW_VERSION_TOAST_APP_FALLBACK_BOTTOM = "6rem";
const NEW_VERSION_TOAST_MOBILE_DOCK_QUERY = "(max-width: 639px)";

const setBrowserLanguages = (languages: readonly string[]) => {
  Object.defineProperty(globalThis.navigator, "languages", {
    configurable: true,
    value: languages,
  });
};

describe("NewVersionToast", () => {
  let originalRequestAnimationFrame:
    | typeof globalThis.requestAnimationFrame
    | undefined;
  let originalCancelAnimationFrame:
    | typeof globalThis.cancelAnimationFrame
    | undefined;
  let originalInnerHeightDescriptor: PropertyDescriptor | undefined;
  let originalMatchMediaDescriptor: PropertyDescriptor | undefined;

  const createDockRect = ({
    height,
    top,
  }: {
    readonly height: number;
    readonly top: number;
  }): DOMRect =>
    ({
      bottom: top + height,
      height,
      left: 0,
      right: 390,
      top,
      width: 390,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;

  const createDockRoot = () => {
    const dockRoot = document.createElement("div");
    dockRoot.setAttribute(MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE, "true");
    document.body.appendChild(dockRoot);

    return dockRoot;
  };

  const createMeasuredDock = ({
    height,
    parentElement,
    top,
  }: {
    readonly height: number;
    readonly parentElement: HTMLElement;
    readonly top: number;
  }) => {
    const dock = document.createElement("div");
    dock.setAttribute(MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE, "true");
    dock.getBoundingClientRect = jest.fn(() => createDockRect({ height, top }));
    parentElement.appendChild(dock);

    return dock;
  };

  const setMobileDockViewport = (matchesMobileDockViewport: boolean) => {
    Object.defineProperty(globalThis.window, "matchMedia", {
      configurable: true,
      value: jest.fn((query: string) => {
        const matches =
          query === NEW_VERSION_TOAST_MOBILE_DOCK_QUERY
            ? matchesMobileDockViewport
            : false;

        return {
          matches,
          media: query,
          onchange: null,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          dispatchEvent: jest.fn(),
        } as MediaQueryList;
      }),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseDeviceInfo.mockReturnValue({
      hasTouchScreen: true,
      isApp: false,
      isAppleMobile: true,
      isMobileDevice: true,
    });
    setBrowserLanguages(["en-US"]);
    globalThis.history.replaceState(
      { test: true },
      "",
      "/waves?wave=abc&showNewVersionToast=true"
    );
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    originalInnerHeightDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "innerHeight"
    );
    originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(
      globalThis.window,
      "matchMedia"
    );
    let animationFrameId = 0;
    const animationFrameTimeouts = new Map<
      number,
      ReturnType<typeof setTimeout>
    >();
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      configurable: true,
      value: jest.fn((callback: FrameRequestCallback) => {
        const frameId = ++animationFrameId;
        const timeoutId = setTimeout(() => {
          animationFrameTimeouts.delete(frameId);
          callback(globalThis.performance.now());
        }, 0);
        animationFrameTimeouts.set(frameId, timeoutId);
        return frameId;
      }),
    });
    Object.defineProperty(globalThis, "cancelAnimationFrame", {
      configurable: true,
      value: jest.fn((frameId: number) => {
        const timeoutId = animationFrameTimeouts.get(frameId);
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
          animationFrameTimeouts.delete(frameId);
        }
      }),
    });
    Object.defineProperty(globalThis, "innerHeight", {
      configurable: true,
      value: 900,
    });
    setMobileDockViewport(false);
  });

  afterEach(() => {
    document
      .querySelectorAll(`[${MOBILE_BOTTOM_NAV_DOCK_ATTRIBUTE}="true"]`)
      .forEach((dock) => dock.remove());
    document
      .querySelectorAll(`[${MOBILE_BOTTOM_NAV_ROOT_ATTRIBUTE}="true"]`)
      .forEach((dockRoot) => dockRoot.remove());

    if (originalRequestAnimationFrame === undefined) {
      delete (globalThis as { requestAnimationFrame?: unknown })
        .requestAnimationFrame;
    } else {
      Object.defineProperty(globalThis, "requestAnimationFrame", {
        configurable: true,
        value: originalRequestAnimationFrame,
      });
    }

    if (originalCancelAnimationFrame === undefined) {
      delete (globalThis as { cancelAnimationFrame?: unknown })
        .cancelAnimationFrame;
    } else {
      Object.defineProperty(globalThis, "cancelAnimationFrame", {
        configurable: true,
        value: originalCancelAnimationFrame,
      });
    }

    if (originalInnerHeightDescriptor === undefined) {
      delete (globalThis as { innerHeight?: unknown }).innerHeight;
    } else {
      Object.defineProperty(
        globalThis,
        "innerHeight",
        originalInnerHeightDescriptor
      );
    }

    if (originalMatchMediaDescriptor === undefined) {
      delete (globalThis.window as { matchMedia?: unknown }).matchMedia;
    } else {
      Object.defineProperty(
        globalThis.window,
        "matchMedia",
        originalMatchMediaDescriptor
      );
    }
  });

  it("returns null when not stale", () => {
    mockedUseIsVersionStale.mockReturnValue(false);
    const { container } = render(<NewVersionToast />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toast", () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    setMobileDockViewport(true);

    const { container } = render(<NewVersionToast />);
    expect(screen.getByText(/new version/i)).toBeInTheDocument();
    expect(screen.getByText("Yes, again!")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass(
      "tw-bottom-[var(--new-version-toast-mobile-bottom,1rem)]"
    );
    expect(container.firstChild).toHaveClass(
      "tw-scale-[var(--new-version-toast-mobile-scale,1)]"
    );
    expect(container.firstChild).toHaveClass("sm:tw-scale-100");
    expect(container.firstChild).toHaveClass("sm:tw-bottom-7");
    expect(
      (container.firstChild as HTMLElement).style.getPropertyValue(
        NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY
      )
    ).toBe(NEW_VERSION_TOAST_WEB_FALLBACK_BOTTOM);
    expect(
      (container.firstChild as HTMLElement).style.getPropertyValue(
        NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY
      )
    ).toBe("1");
    expect(
      container.querySelector('img[src="/emojis/sgt_wink.webp"]')
    ).toBeInTheDocument();
    expect(
      container.querySelector('img[src="/rocket-refresh.png"]')
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("uses browser locale translations for visible and accessible copy", () => {
    setBrowserLanguages(["fr-FR"]);
    mockedUseIsVersionStale.mockReturnValue(true);

    render(<NewVersionToast />);

    expect(
      screen.getByText("Une nouvelle version est disponible")
    ).toBeInTheDocument();
    expect(screen.getByText("Oui, encore !")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Actualiser la page" })
    ).toHaveAttribute("title", "Actualiser la page");
  });

  it("removes the forced toast query param from the current path on refresh", () => {
    mockedUseIsVersionStale.mockReturnValue(true);

    render(<NewVersionToast />);
    fireEvent.click(screen.getByRole("button"));

    expect(globalThis.location.pathname).toBe("/waves");
    expect(globalThis.location.search).toBe("?wave=abc");
  });

  it("tracks the measured mobile dock top while the dock compacts", async () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    setMobileDockViewport(true);
    const dockRoot = createDockRoot();
    const dock = createMeasuredDock({
      height: 64,
      parentElement: dockRoot,
      top: 816,
    });

    const { container } = render(<NewVersionToast />);
    const toastLayer = container.firstChild as HTMLElement;

    await waitFor(() =>
      expect(
        toastLayer.style.getPropertyValue(
          NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY
        )
      ).toBe("88px")
    );
    expect(
      toastLayer.style.getPropertyValue(NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY)
    ).toBe("1");

    (dock.getBoundingClientRect as jest.Mock).mockReturnValue(
      createDockRect({ height: 54, top: 826 })
    );
    dock.dispatchEvent(new Event("transitionrun"));

    await waitFor(() =>
      expect(
        toastLayer.style.getPropertyValue(
          NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY
        )
      ).toBe("78px")
    );
    expect(
      toastLayer.style.getPropertyValue(NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY)
    ).toBe("0.88");
  });

  it("tracks the mobile dock when its root mounts after the toast", async () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseDeviceInfo.mockReturnValue({
      hasTouchScreen: true,
      isApp: true,
      isAppleMobile: true,
      isMobileDevice: true,
    });
    setMobileDockViewport(true);

    const { container } = render(<NewVersionToast />);
    const toastLayer = container.firstChild as HTMLElement;

    expect(
      toastLayer.style.getPropertyValue(
        NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY
      )
    ).toBe(NEW_VERSION_TOAST_APP_FALLBACK_BOTTOM);

    const dockRoot = createDockRoot();
    createMeasuredDock({
      height: 64,
      parentElement: dockRoot,
      top: 816,
    });

    await waitFor(() =>
      expect(
        toastLayer.style.getPropertyValue(
          NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY
        )
      ).toBe("88px")
    );
    expect(
      toastLayer.style.getPropertyValue(NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY)
    ).toBe("1");
  });

  it("does not watch body mutations when mobile web has no dock root", async () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    setMobileDockViewport(true);

    render(<NewVersionToast />);

    const requestAnimationFrameMock =
      globalThis.requestAnimationFrame as jest.Mock;
    await waitFor(() => expect(requestAnimationFrameMock).toHaveBeenCalled());

    const frameCountAfterInitialMeasurement =
      requestAnimationFrameMock.mock.calls.length;
    const unrelatedMutation = document.createElement("div");
    document.body.appendChild(unrelatedMutation);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(requestAnimationFrameMock).toHaveBeenCalledTimes(
      frameCountAfterInitialMeasurement
    );

    unrelatedMutation.remove();
  });

  it("keeps desktop positioning independent from mobile dock measurements", async () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    setMobileDockViewport(false);
    const dockRoot = createDockRoot();
    const dock = createMeasuredDock({
      height: 64,
      parentElement: dockRoot,
      top: 816,
    });

    const { container } = render(<NewVersionToast />);
    const toastLayer = container.firstChild as HTMLElement;

    expect(toastLayer).toHaveClass("sm:tw-bottom-7");
    expect(
      toastLayer.style.getPropertyValue(
        NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY
      )
    ).toBe(NEW_VERSION_TOAST_WEB_FALLBACK_BOTTOM);
    expect(
      toastLayer.style.getPropertyValue(NEW_VERSION_TOAST_MOBILE_SCALE_PROPERTY)
    ).toBe("1");

    await waitFor(() =>
      expect(dock.getBoundingClientRect).not.toHaveBeenCalled()
    );
  });

  it("uses the previous native-app fallback when no mobile dock is measurable", async () => {
    mockedUseIsVersionStale.mockReturnValue(true);
    mockedUseDeviceInfo.mockReturnValue({
      hasTouchScreen: true,
      isApp: true,
      isAppleMobile: true,
      isMobileDevice: true,
    });
    setMobileDockViewport(true);

    const { container } = render(<NewVersionToast />);
    const toastLayer = container.firstChild as HTMLElement;

    await waitFor(() =>
      expect(
        toastLayer.style.getPropertyValue(
          NEW_VERSION_TOAST_MOBILE_BOTTOM_PROPERTY
        )
      ).toBe(NEW_VERSION_TOAST_APP_FALLBACK_BOTTOM)
    );
  });
});
