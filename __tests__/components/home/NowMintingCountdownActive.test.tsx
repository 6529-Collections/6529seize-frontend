import NowMintingCountdownActive from "@/components/home/now-minting/NowMintingCountdownActive";
import type { CountdownData } from "@/hooks/useMintCountdownState";
import { act, render, screen } from "@testing-library/react";

const NOW = 1_800_000_000_000;
const countdown = (seconds: number): CountdownData => ({
  title: "Phase 0 (Allowlist) Starts In",
  targetDate: NOW / 1000 + seconds,
  showAllowlistInfo: false,
  showMintBtn: false,
  isActive: false,
});

describe("NowMintingCountdownActive", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("preserves the original text format across a minute boundary", () => {
    render(
      <NowMintingCountdownActive countdown={countdown(3600 + 8 * 60 + 1)} />
    );
    expect(screen.getByRole("timer")).toHaveTextContent("1h : 8m : 1s");

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent("1h : 8m : 0s");

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent("1h : 7m : 59s");
  });

  it("includes days first and removes them when fewer than 24 hours remain", () => {
    render(<NowMintingCountdownActive countdown={countdown(86400)} />);
    expect(screen.getByRole("timer")).toHaveTextContent(/^1d : 0s$/);

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent("23h : 59m : 59s");
  });

  it("hides zero hours when the remaining time drops below an hour", () => {
    render(<NowMintingCountdownActive countdown={countdown(3600)} />);
    expect(screen.getByRole("timer")).toHaveTextContent(/^1h : 0s$/);

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent(/^59m : 59s$/);
  });

  it("hides zero minutes when the remaining time drops below a minute", () => {
    render(<NowMintingCountdownActive countdown={countdown(60)} />);
    expect(screen.getByRole("timer")).toHaveTextContent(/^1m : 0s$/);

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent(/^59s$/);
  });

  it("shows only seconds below a minute and stops scheduling after expiry", () => {
    render(<NowMintingCountdownActive countdown={countdown(2)} />);
    expect(screen.getByRole("timer")).toHaveTextContent(/^2s$/);

    act(() => jest.advanceTimersByTime(7000));
    expect(screen.getByRole("timer")).toHaveTextContent(/^0s$/);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("updates the target and clears its timer on unmount", () => {
    const { rerender, unmount } = render(
      <NowMintingCountdownActive countdown={countdown(3600)} />
    );
    rerender(<NowMintingCountdownActive countdown={countdown(129)} />);
    expect(screen.getByRole("timer")).toHaveTextContent(/^2m : 9s$/);

    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole("timer")).toHaveTextContent(/^2m : 8s$/);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
