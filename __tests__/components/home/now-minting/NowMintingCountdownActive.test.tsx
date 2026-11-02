import NowMintingCountdownActive from "@/components/home/now-minting/NowMintingCountdownActive";
import { act, render, screen } from "@testing-library/react";

const START_MS = 1_000_000;

function setVisibility(value: DocumentVisibilityState) {
  act(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

const renderCountdown = (secondsLeft: number) =>
  render(
    <NowMintingCountdownActive
      countdown={{
        title: "Public Phase Ends In",
        targetDate: START_MS / 1000 + secondsLeft,
        showAllowlistInfo: false,
        showMintBtn: false,
        isActive: true,
      }}
    />
  );

describe("NowMintingCountdownActive", () => {
  beforeEach(() => {
    setVisibility("visible");
    jest.useFakeTimers();
    jest.setSystemTime(START_MS);
  });

  afterEach(() => {
    jest.useRealTimers();
    setVisibility("visible");
  });

  it("ticks every second while the page is visible", () => {
    renderCountdown(60);
    expect(screen.getByText("1m : 0s")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText("58s")).toBeInTheDocument();
  });

  it("stops while hidden and shows the current time left when shown again", () => {
    renderCountdown(60);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("59s")).toBeInTheDocument();

    setVisibility("hidden");
    expect(jest.getTimerCount()).toBe(0);
    act(() => {
      jest.advanceTimersByTime(20_000);
    });
    expect(screen.getByText("59s")).toBeInTheDocument();

    setVisibility("visible");
    expect(screen.getByText("39s")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("38s")).toBeInTheDocument();
  });
});
