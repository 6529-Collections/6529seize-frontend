import { AuthContext } from "@/components/auth/authContext";
import { useCollectedTracking } from "@/components/user/collected/useCollectedTracking";
import { trackAnalyticsEvent } from "@/services/analytics/mixpanel";
import { Capacitor } from "@capacitor/core";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useContext } from "react";

jest.mock("@/components/auth/Auth", () =>
  jest.requireActual("@/components/auth/authContext")
);
let consent: boolean | undefined;
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useOptionalCookieConsent: () => ({ performanceConsent: consent }),
}));
jest.mock("@/services/analytics/mixpanel", () => ({
  trackAnalyticsEvent: jest.fn(),
}));
jest.mock("@capacitor/core", () => {
  const actual =
    jest.requireActual<typeof import("@capacitor/core")>("@capacitor/core");
  return {
    ...actual,
    Capacitor: { ...actual.Capacitor, isNativePlatform: jest.fn(() => false) },
  };
});

const track = jest.mocked(trackAnalyticsEvent);
const originalObserver = globalThis.IntersectionObserver;
let notify: IntersectionObserverCallback;
let observer: IntersectionObserver;
const observe = jest.fn();
const disconnect = jest.fn();

function Fixture({
  target = "collector",
  ready = true,
  extraAnchor = false,
}: {
  readonly target?: string;
  readonly ready?: boolean;
  readonly extraAnchor?: boolean;
}) {
  const { rootRef, onClickCapture, trackAction } = useCollectedTracking(target);
  return (
    <div
      ref={rootRef}
      onClickCapture={onClickCapture}
      onAuxClickCapture={onClickCapture}
    >
      <section data-profile-section="Collection summary">
        <h2
          data-testid="anchor"
          data-profile-section-anchor={ready ? "Collection summary" : undefined}
        >
          Collection
        </h2>
        {extraAnchor && (
          <h3
            data-testid="extra-anchor"
            data-profile-section-anchor="Collection summary"
          >
            Another summary anchor
          </h3>
        )}
        <button
          data-profile-action="Details"
          onClick={(event) => event.stopPropagation()}
        >
          <span>Private collector name</span>
        </button>
        <span data-profile-action="Complete my set">
          <a href="/collect?address=private">Complete my set</a>
        </span>
        <button data-profile-action="Manage orders" disabled>
          Disabled
        </button>
        <a
          href="/collect/orders"
          data-profile-action="Manage orders"
          aria-disabled="true"
        >
          Unavailable
        </a>
        <button data-profile-action="Private unapproved action">Unknown</button>
        <button onClick={() => trackAction("Filters", "Change address")}>
          Select address
        </button>
      </section>
    </div>
  );
}

function SignedInFixture({
  target = "collector",
  loading = false,
}: {
  readonly target?: string;
  readonly loading?: boolean;
}) {
  const defaults = useContext(AuthContext);
  // Only the identity fields used by ownership checks differ from the default.
  const connectedProfile = {
    id: "private-id",
    normalised_handle: "collector",
    wallets: [{ wallet: "0xprivate" }],
  };
  return (
    <AuthContext
      value={{
        ...defaults,
        fetchingProfile: loading,
        connectedProfile: {
          ...defaults.connectedProfile,
          ...connectedProfile,
        } as NonNullable<typeof defaults.connectedProfile>,
      }}
    >
      <Fixture target={target} />
    </AuthContext>
  );
}

function intersect(ratio = 0.5, target = screen.getByTestId("anchor")) {
  const rect = target.getBoundingClientRect();
  act(() =>
    notify(
      [
        {
          target,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: performance.now(),
          intersectionRatio: ratio,
          isIntersecting: ratio > 0,
        },
      ],
      observer
    )
  );
}

function advance(ms = 1000) {
  act(() => jest.advanceTimersByTime(ms));
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  consent = true;
  track.mockReturnValue(true);
  jest.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  globalThis.IntersectionObserver = jest.fn(
    (callback: IntersectionObserverCallback) => {
      notify = callback;
      observer = {
        observe,
        unobserve: jest.fn(),
        disconnect,
        takeRecords: () => [],
        root: null,
        rootMargin: "0px",
        thresholds: [0.1],
      };
      return observer;
    }
  );
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  globalThis.IntersectionObserver = originalObserver;
});

it.each([undefined, false])(
  "does not observe or send any action without consent (%s)",
  (value) => {
    consent = value;
    render(<Fixture />);
    fireEvent.click(screen.getByText("Private collector name"));
    fireEvent.click(screen.getByText("Select address"));
    expect(observe).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  }
);

it("starts after consent and cancels pending work on withdrawal", () => {
  consent = false;
  const { rerender } = render(<Fixture />);
  consent = true;
  rerender(<Fixture />);
  intersect();
  consent = false;
  rerender(<Fixture />);
  advance();
  fireEvent.click(screen.getByText("Select address"));
  expect(disconnect).toHaveBeenCalled();
  expect(track).not.toHaveBeenCalled();
});

it("waits for ready content and one continuous second, then deduplicates rerenders", async () => {
  const { rerender } = render(
    <StrictMode>
      <Fixture ready={false} />
    </StrictMode>
  );
  expect(observe).not.toHaveBeenCalled();
  await act(async () =>
    rerender(
      <StrictMode>
        <Fixture />
      </StrictMode>
    )
  );
  expect(observe).toHaveBeenCalledWith(screen.getByTestId("anchor"));
  intersect();
  advance(700);
  intersect(0);
  advance();
  expect(track).not.toHaveBeenCalled();
  intersect();
  advance();
  rerender(
    <StrictMode>
      <Fixture />
    </StrictMode>
  );
  intersect();
  advance();
  expect(track).toHaveBeenCalledTimes(1);
});

it("retries a rejected impression while the section stays visible", () => {
  track.mockReturnValueOnce(false);
  render(<Fixture />);
  intersect();
  advance();
  expect(track).toHaveBeenCalledTimes(1);
  advance();
  expect(track).toHaveBeenCalledTimes(2);
  advance(5000);
  expect(track).toHaveBeenCalledTimes(2);
});

it("bounds rejected impressions at three attempts per section", () => {
  track.mockReturnValue(false);
  render(<Fixture />);
  intersect();
  advance(10000);
  expect(track).toHaveBeenCalledTimes(3);
  intersect(0);
  intersect();
  advance();
  expect(track).toHaveBeenCalledTimes(3);
});

it("spaces attempts even when several anchors for the section are visible", () => {
  track.mockReturnValueOnce(false);
  render(<Fixture extraAnchor />);
  intersect();
  intersect(0.5, screen.getByTestId("extra-anchor"));
  advance();
  expect(track).toHaveBeenCalledTimes(1);
  advance();
  expect(track).toHaveBeenCalledTimes(2);
});

it("uses another visible anchor when the first leaves the screen", () => {
  render(<Fixture extraAnchor />);
  intersect();
  intersect(0.5, screen.getByTestId("extra-anchor"));
  advance(700);
  intersect(0);
  advance();
  expect(track).toHaveBeenCalledTimes(1);
});

it("cancels a rejected impression retry when consent is withdrawn", () => {
  track.mockReturnValue(false);
  const { rerender } = render(<Fixture />);
  intersect();
  advance();
  consent = false;
  rerender(<Fixture />);
  advance(5000);
  expect(track).toHaveBeenCalledTimes(1);
});

it("keeps seen sections deduplicated if consent changes during the same visit", () => {
  const { rerender } = render(<Fixture />);
  intersect();
  advance();
  consent = false;
  rerender(<Fixture />);
  consent = true;
  rerender(<Fixture />);
  intersect();
  advance();
  expect(track).toHaveBeenCalledTimes(1);
});

it("ignores background time and cancels pending work on unmount", () => {
  const { unmount } = render(<Fixture />);
  intersect();
  advance(600);
  jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  fireEvent(document, new Event("visibilitychange"));
  advance();
  expect(track).not.toHaveBeenCalled();
  jest.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  fireEvent(document, new Event("visibilitychange"));
  advance(999);
  unmount();
  advance();
  expect(track).not.toHaveBeenCalled();
});

it.each(["self", "other", "anonymous"])(
  "sends the %s viewer group without sending private identity or URLs",
  (context) => {
    if (context === "anonymous") render(<Fixture />);
    else
      render(
        <SignedInFixture
          target={context === "self" ? "COLLECTOR" : "visitor"}
        />
      );
    fireEvent.click(screen.getByText("Private collector name"));
    expect(track).toHaveBeenCalledWith("Profile action clicked", {
      logical_page: "profile_collected",
      page_group: "profile",
      route_pattern: "/:handle/collected",
      profile_tab: "Collected",
      profile_viewer_context: context,
      platform: "desktop_web",
      section: "Collection summary",
      action: "Details",
    });
  }
);

it("waits for the viewer identity to settle and starts fresh exposure for another profile", () => {
  const { rerender } = render(<SignedInFixture loading />);
  fireEvent.click(screen.getByText("Private collector name"));
  expect(track).not.toHaveBeenCalled();
  expect(observe).not.toHaveBeenCalled();
  rerender(<SignedInFixture />);
  intersect();
  advance();
  rerender(<SignedInFixture target="visitor" />);
  intersect();
  advance();
  expect(
    track.mock.calls.map(
      ([, properties]) => properties?.["profile_viewer_context"]
    )
  ).toEqual(["self", "other"]);
});

it("captures wrapper-labelled links and deliberate filter callbacks, ignoring disabled and unknown controls", () => {
  render(<Fixture />);
  fireEvent.click(screen.getByText("Private collector name"));
  fireEvent(
    screen.getByText("Complete my set"),
    new MouseEvent("auxclick", { bubbles: true, button: 1 })
  );
  fireEvent.click(screen.getByText("Select address"));
  fireEvent.click(screen.getByText("Disabled"));
  fireEvent.click(screen.getByText("Unavailable"));
  fireEvent.click(screen.getByText("Unknown"));
  fireEvent(
    screen.getByText("Private collector name"),
    new MouseEvent("auxclick", { bubbles: true, button: 1 })
  );
  fireEvent(
    screen.getByText("Complete my set"),
    new MouseEvent("auxclick", { bubbles: true, button: 2 })
  );
  expect(
    track.mock.calls.map(([, properties]) => properties?.["action"])
  ).toEqual(["Details", "Complete my set", "Change address"]);
});

it("keeps action tracking usable without the visibility API and identifies native use", () => {
  Reflect.deleteProperty(globalThis, "IntersectionObserver");
  jest.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(true);
  render(<Fixture />);
  fireEvent.click(screen.getByText("Private collector name"));
  expect(track).toHaveBeenCalledWith(
    "Profile action clicked",
    expect.objectContaining({ platform: "native" })
  );
});
