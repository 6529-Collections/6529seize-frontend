import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  WaveInformationProvider,
  useWaveInformation,
} from "@/contexts/WaveInformationContext";
import { StrictMode, useEffect } from "react";

jest.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const mockDesktop = jest.fn();
function Harness() {
  const information = useWaveInformation()!;
  useEffect(
    () => information.registerDesktopHandler(mockDesktop),
    [information.registerDesktopHandler]
  );
  return (
    <>
      <input aria-label="Unfinished message" defaultValue="keep me" />
      <button onClick={() => information.open("wave")}>
        Open mobile information
      </button>
      <button onClick={() => information.open("wave", false)}>
        Open desktop information
      </button>
      {information.request && (
        <div role="dialog">
          <button onClick={information.close}>Close</button>
          <button onClick={information.openNotifications}>
            Open notifications
          </button>
          {information.request.view === "notifications" && (
            <>
              <span>Notification view</span>
              <button onClick={information.back}>Back</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
it("keeps the original URL and mounted state through open, close and browser Back", async () => {
  window.history.replaceState(
    {},
    "",
    "/waves/wave/competitions/alpha?tab=votes&voteTab=activity&curation=art"
  );
  const url = window.location.href;
  render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  const input = screen.getByLabelText("Unfinished message");
  fireEvent.click(screen.getByText("Open mobile information"));
  expect(window.location.href).toBe(url);
  expect(screen.getByRole("dialog")).toBeVisible();
  fireEvent.click(screen.getByText("Close"));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() =>
    expect(
      (window.history.state as { waveInformation?: string }).waveInformation
    ).toBeUndefined()
  );
  expect(screen.getByLabelText("Unfinished message")).toBe(input);
  expect(input).toHaveValue("keep me");
  fireEvent.click(screen.getByText("Open mobile information"));
  window.history.back();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(window.location.href).toBe(url);
});
it("opens desktop About through its registered handler without adding a history entry", () => {
  render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  const historyLength = window.history.length;
  fireEvent.click(screen.getByText("Open desktop information"));
  expect(mockDesktop).toHaveBeenCalledWith("wave");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(window.history.length).toBe(historyLength);
});
it("discards an information request after navigating away from its original view", () => {
  window.history.replaceState({}, "", "/waves/wave?tab=chat");
  const children = (
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  const { rerender } = render(children);
  fireEvent.click(screen.getByText("Open mobile information"));
  expect(screen.getByRole("dialog")).toBeVisible();
  window.history.pushState({}, "", "/profiles/creator");
  rerender(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});
it.each([
  { unavailable: "crypto", crypto: undefined },
  { unavailable: "randomUUID", crypto: { randomUUID: undefined } },
])(
  "opens without $unavailable while preserving Next history state",
  ({ crypto }) => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "crypto");
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: crypto,
    });
    try {
      window.history.replaceState(
        { nextState: "kept" },
        "",
        "/waves/wave?tab=chat"
      );
      render(
        <WaveInformationProvider>
          <Harness />
        </WaveInformationProvider>
      );
      fireEvent.click(screen.getByText("Open mobile information"));
      expect(screen.getByRole("dialog")).toBeVisible();
      expect(window.history.state).toMatchObject({
        nextState: "kept",
        waveInformation: expect.any(String),
      });
    } finally {
      if (original) Object.defineProperty(globalThis, "crypto", original);
      else Reflect.deleteProperty(globalThis, "crypto");
    }
  }
);
it("retains the matching information history entry and closes when returning to the underlying view", () => {
  render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  fireEvent.click(screen.getByText("Open mobile information"));
  act(() =>
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: window.history.state })
    )
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  act(() => window.dispatchEvent(new PopStateEvent("popstate", { state: {} })));
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("does not reopen a stale information request when returning to its original route", () => {
  window.history.replaceState({}, "", "/waves/wave?tab=chat");
  const { rerender } = render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  fireEvent.click(screen.getByText("Open mobile information"));
  window.history.pushState({}, "", "/profiles/creator");
  rerender(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  window.history.pushState({}, "", "/waves/wave?tab=chat");
  rerender(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  expect(screen.queryByRole("dialog")).toBeNull();
});
it("uses one navigation entry when leaving information and preserves Back and Forward", async () => {
  const originalUrl =
    "/waves/wave/competitions/alpha?tab=votes&voteTab=activity";
  window.history.replaceState({ original: "kept" }, "", originalUrl);
  const { rerender } = render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  fireEvent.click(screen.getByText("Open mobile information"));
  const informationPush = window.history.pushState;
  const overlayHistoryLength = window.history.length;
  const navigationState = { ...window.history.state, nextTree: "profile" };
  window.history.pushState(navigationState, "", "/profiles/creator");
  rerender(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(window.history.pushState).not.toBe(informationPush);
  expect(window.history.length).toBe(overlayHistoryLength);
  expect(window.history.state).toMatchObject({ nextTree: "profile" });
  expect(window.history.state).not.toHaveProperty("waveInformation");
  expect(navigationState).toHaveProperty("waveInformation");
  window.history.back();
  await waitFor(() =>
    expect(window.location.pathname + window.location.search).toBe(originalUrl)
  );
  expect(window.history.state).toEqual({ original: "kept" });
  expect(screen.queryByRole("dialog")).toBeNull();
  window.history.forward();
  await waitFor(() =>
    expect(window.location.pathname).toBe("/profiles/creator")
  );
  expect(window.history.state).toMatchObject({ nextTree: "profile" });
  expect(window.history.state).not.toHaveProperty("waveInformation");
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("navigates inside one information request and restores its parent with Back", async () => {
  window.history.replaceState({ original: "kept" }, "", "/waves/wave");
  render(
    <StrictMode>
      <WaveInformationProvider>
        <Harness />
      </WaveInformationProvider>
    </StrictMode>
  );
  fireEvent.click(screen.getByText("Open mobile information"));
  const length = window.history.length;
  const input = screen.getByLabelText("Unfinished message");
  fireEvent.click(screen.getByText("Open notifications"));
  fireEvent.click(screen.getByText("Open notifications"));
  expect(window.history.length).toBe(length + 1);
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByText("Notification view")).toBeVisible();
  fireEvent.click(screen.getByText("Back"));
  await waitFor(() =>
    expect(screen.queryByText("Notification view")).toBeNull()
  );
  expect(screen.getByLabelText("Unfinished message")).toBe(input);
  expect(input).toHaveValue("keep me");
  fireEvent.click(screen.getByText("Open notifications"));
  window.history.back();
  await waitFor(() =>
    expect(screen.queryByText("Notification view")).toBeNull()
  );
  expect(screen.getByRole("dialog")).toBeVisible();
  fireEvent.click(screen.getByText("Close"));
  await waitFor(() =>
    expect(window.history.state).toEqual({ original: "kept" })
  );
});

it("Close removes both notification and About entries without leaving a phantom Back step", async () => {
  window.history.replaceState({ original: "kept" }, "", "/waves/wave");
  render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  fireEvent.click(screen.getByText("Open mobile information"));
  fireEvent.click(screen.getByText("Open notifications"));
  fireEvent.click(screen.getByText("Close"));
  expect(screen.queryByRole("dialog")).toBeNull();
  await waitFor(() =>
    expect(window.history.state).toEqual({ original: "kept" })
  );
  expect(window.location.pathname).toBe("/waves/wave");
});

it("recovers when route navigation interrupts a pending sheet traversal", () => {
  window.history.replaceState({}, "", "/waves/wave");
  const { rerender } = render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  fireEvent.click(screen.getByText("Open mobile information"));
  fireEvent.click(screen.getByText("Open notifications"));
  const back = jest.spyOn(window.history, "back").mockImplementation(() => {});
  try {
    fireEvent.click(screen.getByText("Back"));
    window.history.pushState({}, "", "/profiles/creator");
    rerender(
      <WaveInformationProvider>
        <Harness />
      </WaveInformationProvider>
    );
    fireEvent.click(screen.getByText("Open mobile information"));
    expect(screen.getByRole("dialog")).toBeVisible();
    fireEvent.click(screen.getByText("Open notifications"));
    expect(screen.getByText("Notification view")).toBeVisible();
  } finally {
    back.mockRestore();
  }
});

it("starts a fresh About view when opening from a stale Forward history entry", () => {
  window.history.replaceState(
    { waveInformation: "old-sheet", waveInformationView: "notifications" },
    "",
    "/waves/wave"
  );
  render(
    <WaveInformationProvider>
      <Harness />
    </WaveInformationProvider>
  );
  fireEvent.click(screen.getByText("Open mobile information"));
  expect(screen.queryByText("Notification view")).toBeNull();
  fireEvent.click(screen.getByText("Open notifications"));
  expect(screen.getByText("Notification view")).toBeVisible();
});
