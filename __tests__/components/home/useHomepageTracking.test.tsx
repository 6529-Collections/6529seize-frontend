import { useHomepageTracking } from "@/components/home/useHomepageTracking";
import { trackAnalyticsEvent } from "@/services/analytics/mixpanel";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";

let consent: boolean | undefined;
jest.mock("@/components/cookies/CookieConsentContext", () => ({
  useOptionalCookieConsent: () => ({ performanceConsent: consent }),
}));
jest.mock("@/services/analytics/mixpanel", () => ({
  trackAnalyticsEvent: jest.fn(),
}));

const originalObserver = globalThis.IntersectionObserver;
let notify: IntersectionObserverCallback;
let observer: IntersectionObserver;
const observe = jest.fn();
const unobserve = jest.fn();
const disconnect = jest.fn();

function Fixture({
  ready = true,
  signedIn = false,
}: {
  readonly ready?: boolean;
  readonly signedIn?: boolean;
}) {
  const { rootRef, onClickCapture } = useHomepageTracking(signedIn);
  return (
    <div
      ref={rootRef}
      onClickCapture={onClickCapture}
      onAuxClickCapture={onClickCapture}
    >
      <section
        data-testid="section"
        data-home-section={ready ? "Explore waves" : undefined}
      >
        <button
          data-home-action="Open wave"
          onClick={(event) => event.stopPropagation()}
        >
          <span>Private wave title</span>
        </button>
        <button data-home-action="Connect wallet" disabled>
          Disabled
        </button>
        <button data-home-action="Unapproved private text">Unknown</button>
        <button>Untracked</button>
        <a href="/waves" data-home-action="View all">
          All waves
        </a>
      </section>
    </div>
  );
}

function intersect(ratio: number) {
  const target = screen.getByTestId("section");
  const rect = target.getBoundingClientRect();
  act(() => {
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
    );
  });
}

function advance(ms = 1000) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  consent = true;
  jest.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  globalThis.IntersectionObserver = jest.fn(
    (callback: IntersectionObserverCallback) => {
      notify = callback;
      observer = {
        observe,
        unobserve,
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
  "does not observe or send clicks with consent %s",
  (value) => {
    consent = value;
    render(<Fixture />);
    fireEvent.click(screen.getByText("Private wave title"));
    expect(observe).not.toHaveBeenCalled();
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  }
);

it("requires one continuous visible second and counts a section once per visit", () => {
  render(
    <StrictMode>
      <Fixture />
    </StrictMode>
  );
  intersect(0.5);
  advance(600);
  intersect(0);
  advance();
  expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  intersect(0.5);
  advance(999);
  expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  advance(1);
  expect(trackAnalyticsEvent).toHaveBeenCalledWith(
    "Homepage section seen",
    expect.objectContaining({
      section: "Explore waves",
      logical_page: "home",
      signed_in: false,
    })
  );
  intersect(0);
  intersect(0.5);
  advance();
  expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
});

it("starts observing when loading content is replaced and uses the current sign-in state", async () => {
  const { rerender } = render(<Fixture ready={false} />);
  expect(observe).not.toHaveBeenCalled();
  await act(async () => rerender(<Fixture signedIn />));
  expect(observe).toHaveBeenCalledWith(screen.getByTestId("section"));
  intersect(0.5);
  advance();
  expect(trackAnalyticsEvent).toHaveBeenCalledWith(
    "Homepage section seen",
    expect.objectContaining({ signed_in: true })
  );
});

it("does not count background-tab time", () => {
  render(<Fixture />);
  intersect(0.5);
  advance(600);
  jest.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  fireEvent(document, new Event("visibilitychange"));
  advance();
  expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  jest.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  fireEvent(document, new Event("visibilitychange"));
  advance(999);
  expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  advance(1);
  expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
});

it("cancels pending observations and clicks when consent is withdrawn", () => {
  const { rerender } = render(<Fixture />);
  intersect(0.5);
  consent = false;
  rerender(<Fixture />);
  advance();
  fireEvent.click(screen.getByText("Private wave title"));
  expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  expect(disconnect).toHaveBeenCalled();
});

it("cancels work on unmount and counts a fresh visit again", () => {
  const first = render(<Fixture />);
  intersect(0.5);
  first.unmount();
  advance();
  expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  const second = render(<Fixture />);
  intersect(0.5);
  advance();
  second.unmount();
  render(<Fixture />);
  intersect(0.5);
  advance();
  expect(trackAnalyticsEvent).toHaveBeenCalledTimes(2);
});

it("captures labelled clicks despite stopPropagation without copying private text", () => {
  render(<Fixture />);
  fireEvent.click(screen.getByText("Private wave title"));
  expect(trackAnalyticsEvent).toHaveBeenCalledWith("Homepage action clicked", {
    section: "Explore waves",
    action: "Open wave",
    logical_page: "home",
    layout_version: "1",
    signed_in: false,
    is_native: false,
    screen_size: "Large",
  });
  fireEvent.click(screen.getByText("Disabled"));
  fireEvent.click(screen.getByText("Unknown"));
  fireEvent.click(screen.getByText("Untracked"));
  expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
});

it("keeps click tracking usable without IntersectionObserver", () => {
  Reflect.deleteProperty(globalThis, "IntersectionObserver");
  render(<Fixture />);
  fireEvent.click(screen.getByText("Private wave title"));
  expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
});

it("counts middle-clicked links but not middle-clicked buttons or context menus", () => {
  render(<Fixture />);
  fireEvent(
    screen.getByText("All waves"),
    new MouseEvent("auxclick", { bubbles: true, button: 1 })
  );
  expect(trackAnalyticsEvent).toHaveBeenCalledWith(
    "Homepage action clicked",
    expect.objectContaining({ action: "View all" })
  );
  fireEvent(
    screen.getByText("Private wave title"),
    new MouseEvent("auxclick", { bubbles: true, button: 1 })
  );
  fireEvent(
    screen.getByText("All waves"),
    new MouseEvent("auxclick", { bubbles: true, button: 2 })
  );
  expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
});
