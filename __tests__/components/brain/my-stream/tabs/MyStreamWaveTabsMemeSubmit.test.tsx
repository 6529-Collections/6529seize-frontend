import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import MyStreamWaveTabsMemeSubmit from "@/components/brain/my-stream/tabs/MyStreamWaveTabsMemeSubmit";
import { SubmissionStatus } from "@/hooks/useWave";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

let mockDisplayTimeZone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
jest.mock("@/hooks/useDisplayTimeZone", () => ({
  ...jest.requireActual("@/hooks/useDisplayTimeZone"),
  useDisplayTimeZone: () => mockDisplayTimeZone,
}));

const useWave = jest.fn();
const useCountdown = jest.fn();

jest.mock("@/hooks/useWave", () => ({
  useWave: (...args: any[]) => useWave(...args),
  SubmissionStatus: jest.requireActual("../../../../../hooks/useWave")
    .SubmissionStatus,
}));

jest.mock("@/hooks/useCountdown", () => ({
  useCountdown: (...args: any[]) => useCountdown(...args),
}));

const baseInfo = {
  voting: {},
  chat: {},
  decisions: {},
  isChatWave: false,
  isRankWave: false,
  isMemesWave: true,
  isDm: false,
} as any;

const wave = { id: "w1" } as any;

function renderComponent(info: any, iconOnly = false) {
  useWave.mockReturnValue(info);
  const onSubmit = jest.fn();
  return {
    ...render(
      <MyStreamWaveTabsMemeSubmit
        wave={wave}
        handleMemesSubmit={onSubmit}
        iconOnly={iconOnly}
      />
    ),
    onSubmit,
  };
}

describe("MyStreamWaveTabsMemeSubmit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCountdown.mockReturnValue("soon");
    mockDisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
  });

  it("opens the closing time from the restricted submission control", async () => {
    const now = Date.now();
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.ENDED,
        startTime: now - 1000,
        endTime: now - 500,
      },
    });
    expect(screen.getByTestId("closed")).toHaveAccessibleName(
      "Submissions Closed"
    );
    expect(screen.getByTestId("closed")).toHaveAttribute(
      "aria-haspopup",
      "dialog"
    );
    expect(screen.getByTestId("closed")).toHaveAttribute(
      "data-full-width",
      "false"
    );
    const reason = `Submissions closed on ${new Date(now - 500).toLocaleString()}`;
    expect(screen.getByTestId("closed")).toHaveAccessibleDescription(reason);
    fireEvent.click(screen.getByTestId("closed"));
    const dialog = await screen.findByRole("dialog", {
      name: "Submissions Closed",
    });
    expect(within(dialog).getByText(reason)).toBeVisible();
  });

  it("renders coming soon state", () => {
    const now = Date.now();
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.NOT_STARTED,
        startTime: now + 3600,
        endTime: now + 7200,
      },
    });
    expect(screen.getByTestId("info")).toHaveAccessibleName(
      "Submissions Open Soon"
    );
    expect(screen.getByTestId("info")).toHaveAttribute(
      "aria-haspopup",
      "dialog"
    );
    expect(screen.getByTestId("info")).toHaveAttribute(
      "data-full-width",
      "false"
    );
    expect(screen.getByTestId("info")).toHaveAccessibleDescription(
      `Submissions open on ${new Date(now + 3600).toLocaleString()}`
    );
  });

  it.each([false, true])(
    "renders not eligible state with iconOnly=%s",
    (iconOnly) => {
      renderComponent(
        {
          ...baseInfo,
          participation: {
            status: SubmissionStatus.ACTIVE,
            isEligible: false,
            startTime: 0,
            endTime: 0,
          },
        },
        iconOnly
      );
      const button = screen.getByRole("button", { name: "How to Submit" });
      expect(button).toHaveAttribute("aria-haspopup", "dialog");
      expect(button).not.toBeDisabled();
      expect(screen.queryByTestId("info")).not.toBeInTheDocument();
      expect(screen.queryByText("Not Eligible")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Not Eligible to Submit")
      ).not.toBeInTheDocument();
      expect(screen.getByText("How to Submit")).toBeInTheDocument();
    }
  );

  it("renders limit reached state", () => {
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.ACTIVE,
        isEligible: true,
        hasReachedLimit: true,
        maxSubmissions: 2,
        startTime: 0,
        endTime: 0,
      },
    });
    expect(screen.getByTestId("info")).toHaveAccessibleName(
      "Submission Limit Reached"
    );
    expect(screen.getByTestId("info")).toHaveAccessibleDescription(
      "You have already submitted the maximum allowed (2 submissions)"
    );
  });

  it("labels an unavailable active submission as restricted", () => {
    renderComponent({
      ...baseInfo,
      participation: {
        status: SubmissionStatus.ACTIVE,
        isEligible: true,
        hasReachedLimit: false,
        remainingSubmissions: null,
        canSubmitNow: false,
        isWithinPeriod: true,
        startTime: 0,
        endTime: 0,
      },
    });

    expect(
      screen.getByRole("button", { name: "Submission Unavailable" })
    ).toHaveAccessibleDescription("You cannot submit at this time");
  });

  it.each([false, true])(
    "renders active state with urgency and remaining badge with iconOnly=%s",
    (iconOnly) => {
      const now = Date.now();
      useCountdown.mockReturnValue("3h");
      const { onSubmit } = renderComponent(
        {
          ...baseInfo,
          participation: {
            status: SubmissionStatus.ACTIVE,
            isEligible: true,
            hasReachedLimit: false,
            remainingSubmissions: 2,
            maxSubmissions: 5,
            canSubmitNow: true,
            isWithinPeriod: true,
            startTime: now - 1000,
            endTime: now + 3 * 60 * 60 * 1000,
          },
        },
        iconOnly
      );
      const button = screen.getByRole("button", { name: /Submit Meme/ });
      expect(button).toHaveAttribute(
        "title",
        expect.stringContaining("You have")
      );
      expect(button).toHaveClass(iconOnly ? "tw-size-8" : "tw-h-8");
      expect(button).not.toBeDisabled();
      expect(screen.getByText("Submit Meme")).toBeInTheDocument();
      expect(screen.getByText("Closing 3h")).toHaveClass("tw-hidden");
      expect(screen.getByText("2 Left")).toHaveClass("tw-hidden");
      fireEvent.click(button);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    }
  );

  describe("display time zone", () => {
    // The fields Date#toLocaleString() prints by default.
    const inZone = (value: number, timeZone: string) =>
      new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZone,
        timeZoneName: "short",
      });

    it("dates the closed tooltip in the display zone and names it", () => {
      mockDisplayTimeZone = { timeZone: "Asia/Dubai", isLocal: false };
      // 23:59 UTC on Jan 1 is already Jan 2 in Dubai.
      const endTime = Date.UTC(2026, 0, 1, 23, 59);
      renderComponent({
        ...baseInfo,
        participation: {
          status: SubmissionStatus.ENDED,
          startTime: endTime - 1000,
          endTime,
        },
      });
      const reason = `Submissions closed on ${inZone(endTime, "Asia/Dubai")}`;
      expect(reason).toMatch(/GMT\+4$/);
      expect(screen.getByTestId("closed")).toHaveAccessibleDescription(reason);
    });

    it("names the zone on the opening time", () => {
      mockDisplayTimeZone = { timeZone: "UTC", isLocal: false };
      const startTime = Date.UTC(2026, 0, 2, 0, 30);
      renderComponent({
        ...baseInfo,
        participation: {
          status: SubmissionStatus.NOT_STARTED,
          startTime,
          endTime: startTime + 1000,
        },
      });
      expect(screen.getByTestId("info")).toHaveAccessibleDescription(
        `Submissions open on ${inZone(startTime, "UTC")}`
      );
    });

    it("names the zone on the closing-soon tooltip", () => {
      mockDisplayTimeZone = { timeZone: "UTC", isLocal: false };
      const endTime = Date.now() + 12 * 60 * 60 * 1000;
      renderComponent({
        ...baseInfo,
        participation: {
          status: SubmissionStatus.ACTIVE,
          isEligible: true,
          hasReachedLimit: false,
          remainingSubmissions: 10,
          maxSubmissions: 10,
          canSubmitNow: true,
          isWithinPeriod: true,
          startTime: endTime - 1000,
          endTime,
        },
      });
      expect(
        screen.getByRole("button", { name: /Submit Meme/ })
      ).toHaveAttribute(
        "title",
        `Submissions closing soon! Ends on ${inZone(endTime, "UTC")}`
      );
    });
  });
});
