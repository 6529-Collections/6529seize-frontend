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

describe.each(["default", "home"] as const)(
  "NowMintingCountdownActive (%s)",
  (variant) => {
    const expectedText = (text: string) =>
      variant === "home"
        ? text.replace(/\d+(?=[dhms])/g, (value) => value.padStart(2, "0"))
        : text;
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(NOW);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("preserves the timing across a minute boundary", () => {
      render(
        <NowMintingCountdownActive
          variant={variant}
          countdown={countdown(3600 + 8 * 60 + 1)}
        />
      );
      expect(screen.getByRole("timer")).toHaveTextContent(
        expectedText("1h : 8m : 1s")
      );

      act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent(
        expectedText("1h : 8m : 0s")
      );

      act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent(
        expectedText("1h : 7m : 59s")
      );
    });

    it("includes days first and removes them when fewer than 24 hours remain", () => {
      render(
        <NowMintingCountdownActive
          variant={variant}
          countdown={countdown(86400)}
        />
      );
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("1d : 0s")}$`)
      );

      act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent(
        expectedText("23h : 59m : 59s")
      );
    });

    it("hides zero hours when the remaining time drops below an hour", () => {
      render(
        <NowMintingCountdownActive
          variant={variant}
          countdown={countdown(3600)}
        />
      );
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("1h : 0s")}$`)
      );

      act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("59m : 59s")}$`)
      );
    });

    it("hides zero minutes when the remaining time drops below a minute", () => {
      render(
        <NowMintingCountdownActive
          variant={variant}
          countdown={countdown(60)}
        />
      );
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("1m : 0s")}$`)
      );

      act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("59s")}$`)
      );
    });

    it("shows only seconds below a minute and stops scheduling after expiry", () => {
      render(
        <NowMintingCountdownActive variant={variant} countdown={countdown(2)} />
      );
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("2s")}$`)
      );

      act(() => jest.advanceTimersByTime(7000));
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("0s")}$`)
      );
      expect(jest.getTimerCount()).toBe(0);
    });

    it("updates the target and clears its timer on unmount", () => {
      const { rerender, unmount } = render(
        <NowMintingCountdownActive
          variant={variant}
          countdown={countdown(3600)}
        />
      );
      rerender(
        <NowMintingCountdownActive
          variant={variant}
          countdown={countdown(129)}
        />
      );
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("2m : 9s")}$`)
      );

      act(() => jest.advanceTimersByTime(1000));
      expect(screen.getByRole("timer")).toHaveTextContent(
        new RegExp(`^${expectedText("2m : 8s")}$`)
      );
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    });
    it.each([
      ["Phase 0 (Allowlist)", false],
      ["Phase 1 (Allowlist)", false],
      ["Phase 2 (Allowlist)", false],
      ["Public Phase", true],
    ] as const)(
      "preserves the label, pill, tooltip, and mint link for %s",
      (phase, isActive) => {
        const timing = isActive ? "Ends In" : "Starts In";
        render(
          <NowMintingCountdownActive
            variant={variant}
            countdown={{
              ...countdown(129),
              title: `${phase} ${timing}`,
              isActive,
              showAllowlistInfo: !isActive,
              showMintBtn: true,
            }}
          />
        );
        expect(
          screen.getByText(`${phase} ${timing}`, {
            exact: true,
          })
        ).toBeInTheDocument();
        expect(
          screen.getByText(isActive ? "Live" : "Upcoming", { exact: true })
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Mint" })).toHaveAttribute(
          "href",
          "/the-memes/mint"
        );
        expect(
          document.querySelector('[data-tooltip-id="allowlist-info"]') !== null
        ).toBe(!isActive);
      }
    );
  }
);
