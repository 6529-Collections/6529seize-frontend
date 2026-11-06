import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import WaveHeaderRestrictionButton from "@/components/waves/header/WaveHeaderRestrictionButton";
import { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/components/utils/tooltip/HoverCard", () => ({
  __esModule: true,
  default: ({
    children,
    content,
    ariaLabel,
  }: {
    children: ReactNode;
    content: ReactNode;
    ariaLabel: string;
  }) => (
    <>
      {children}
      <div role="dialog" aria-label={ariaLabel}>
        {content}
      </div>
    </>
  ),
}));

jest.mock("@/components/waves/WaveSubmissionAccessDetails", () => ({
  __esModule: true,
  default: ({ isClosed }: { isClosed: boolean }) => (
    <p>{isClosed ? "Closed guidance" : "Open guidance"}</p>
  ),
}));

jest.mock("@/services/app-activity/native-app-activity", () => ({
  getNativeAppActivity: () => true,
  subscribeNativeAppActivity: () => jest.fn(),
}));

function setVisibility(value: DocumentVisibilityState) {
  act(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("WaveHeaderRestrictionButton submission deadline", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-11-03T12:00:00Z"));
    setVisibility("visible");
  });

  afterEach(() => {
    setVisibility("visible");
    jest.useRealTimers();
  });

  it.each([false, true])(
    "updates the same mounted restriction after its deadline (hidden=%s)",
    (hidden) => {
      const accessWave = Object.assign(new ApiWave(), {
        participation: { period: { max: Date.now() + 1000 } },
      });
      const { unmount } = render(
        <WaveHeaderRestrictionButton
          label="Submit drop"
          reason="You don't have permission to submit in this wave"
          accessWave={accessWave}
        >
          Lock
        </WaveHeaderRestrictionButton>
      );
      const action = screen.getByRole("button", { name: "Submit drop" });
      expect(action).toHaveAccessibleDescription(
        "You don't have permission to submit in this wave"
      );
      expect(screen.getByText("Open guidance")).toBeInTheDocument();

      if (hidden) setVisibility("hidden");
      act(() => jest.advanceTimersByTime(2000));
      if (hidden) {
        expect(screen.getByText("Open guidance")).toBeInTheDocument();
        setVisibility("visible");
      }

      expect(action).toHaveAccessibleDescription("Submission period has ended");
      expect(screen.getByText("Closed guidance")).toBeInTheDocument();
      expect(screen.queryByText("Open guidance")).not.toBeInTheDocument();
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    }
  );
});
