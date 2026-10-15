import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { MyStreamWaveTab } from "@/types/waves.types";
import { mockDefaultTimeZone } from "../../../utils/timeZoneHydration";

const setActiveContentTab = jest.fn();
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: jest.fn(() => ({
    hideNftPurchasing: false,
    shouldRedirect: false,
  })),
}));

jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ setActiveContentTab }),
}));

const useLayoutMock = jest.fn();
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => useLayoutMock(),
}));

import MyStreamWaveFAQ from "@/components/brain/my-stream/MyStreamWaveFAQ";

const SUMMER_MONDAY = Date.UTC(2026, 6, 13, 10);
const WINTER_MONDAY = Date.UTC(2026, 0, 12, 10);

const waveWithFirstDecision = (firstDecisionTime: number): ApiWave =>
  ({
    wave: {
      decisions_strategy: {
        first_decision_time: firstDecisionTime,
        subsequent_decisions: [172_800_000, 172_800_000, 259_200_000],
        is_rolling: true,
      },
    },
  }) as unknown as ApiWave;

// first_decision_time of the live Memes wave: 2025-03-31T16:00:00Z.
const MEMES_WAVE = waveWithFirstDecision(Date.UTC(2025, 2, 31, 16));

const openVotingSection = () =>
  fireEvent.click(
    screen.getByRole("button", { name: "How Does Voting Work?" })
  );

describe("MyStreamWaveFAQ", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest
      .mocked(useNftPurchasingVisibility)
      .mockReturnValue({ hideNftPurchasing: false, shouldRedirect: false });
    setActiveContentTab.mockClear();
    useLayoutMock.mockReturnValue({ faqViewStyle: { height: "21px" } });
  });

  it("hides the first-party minting section on restricted iOS", () => {
    jest
      .mocked(useNftPurchasingVisibility)
      .mockReturnValue({ hideNftPurchasing: true, shouldRedirect: true });
    render(<MyStreamWaveFAQ wave={{} as any} />);
    expect(
      screen.queryByRole("button", { name: "Minting a Meme Card" })
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Intro" })).toBeInTheDocument();
  });

  it("sets active tab to FAQ, applies style, and opens intro by default", () => {
    const { container } = render(<MyStreamWaveFAQ wave={{} as any} />);

    expect(setActiveContentTab).toHaveBeenCalledWith(MyStreamWaveTab.FAQ);
    const rootDiv = container.firstChild as HTMLElement;
    expect(rootDiv).toHaveAttribute("style", "height: 21px;");
    expect(
      screen.getByRole("heading", { level: 3, name: "Intro" })
    ).toBeInTheDocument();

    const introButton = screen.getByRole("button", { name: "Intro" });
    expect(introButton).toHaveAttribute("aria-expanded", "true");
    expect(introButton.className).toContain("focus-visible:tw-ring-2");
    expect(
      screen.getByRole("heading", {
        level: 4,
        name: "What are we doing here?",
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Intro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intro" })).toHaveAttribute(
      "aria-controls"
    );
    expect(screen.getByRole("button", { name: "Intro" })).toHaveAttribute("id");
    expect(
      screen
        .getByRole("region", { name: "Intro" })
        .getAttribute("aria-labelledby")
    ).toBe(screen.getByRole("button", { name: "Intro" }).getAttribute("id"));
    expect(
      screen.getByText("Voting for the next The Memes card to be minted")
    ).toBeInTheDocument();
  });

  it("switches accordion sections and preserves important links", () => {
    render(<MyStreamWaveFAQ wave={{} as any} />);

    const goalsButton = screen.getByRole("button", {
      name: "What are the goals of the voting?",
    });
    fireEvent.click(goalsButton);

    const introButton = screen.getByRole("button", { name: "Intro" });
    expect(introButton).toHaveAttribute("aria-expanded", "false");
    expect(introButton).not.toHaveAttribute("aria-controls");
    expect(goalsButton).toHaveAttribute("aria-expanded", "true");
    expect(goalsButton).toHaveAttribute("aria-controls");
    expect(screen.getByText("Artistic excellence")).toBeInTheDocument();
    const artistBriefLink = screen.getByRole("link", {
      name: /Read Artist Brief.*opens in a new tab/i,
    });
    expect(artistBriefLink).toHaveAttribute(
      "href",
      "https://docs.google.com/presentation/d/1Aejko31qFkAIyu-Qc3Ao9tHQGbbaFCIcqrBj_kZzo_M/edit#slide=id.p1"
    );
    expect(artistBriefLink).toHaveAttribute("target", "_blank");
    expect(artistBriefLink).toHaveAttribute("rel", "noopener noreferrer");

    fireEvent.click(
      screen.getByRole("button", { name: "How Does Submission Work?" })
    );

    expect(
      screen.getByRole("heading", {
        level: 4,
        name: "What if I do not know how to get nominated?",
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/50,000 "MemesNominee" rep/)).toBeInTheDocument();
    const nominationWaveLink = screen.getByRole("link", {
      name: /Nomination Wave.*opens in a new tab/i,
    });
    expect(nominationWaveLink).toHaveAttribute(
      "href",
      "https://6529.io/waves/0ecb95d0-d8f2-48e8-8137-bfa71ee8593c"
    );
    expect(nominationWaveLink).toHaveAttribute("target", "_blank");
    expect(nominationWaveLink).toHaveAttribute("rel", "noopener noreferrer");

    const faqWaveLink = screen.getByRole("link", {
      name: /FAQ Wave.*opens in a new tab/i,
    });
    expect(faqWaveLink).toHaveAttribute(
      "href",
      "https://6529.io/waves/e2dae377-d27d-4a69-8b77-38d88fad4d01"
    );
    expect(faqWaveLink).toHaveAttribute("target", "_blank");
    expect(faqWaveLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("states the checkpoint time as 16:00 UTC rather than 17:00 GMT", () => {
    jest.spyOn(Date, "now").mockReturnValue(WINTER_MONDAY);
    const restoreZone = mockDefaultTimeZone("America/Los_Angeles");
    try {
      render(<MyStreamWaveFAQ wave={MEMES_WAVE} />);
      openVotingSection();

      const region = screen.getByRole("region", {
        name: "How Does Voting Work?",
      });
      expect(region).toHaveTextContent(
        "The checkpoint times are Monday / Wednesday / Friday at 16:00 UTC (your time: Mon, Wed, Fri 08:00 PST)."
      );
      expect(region).toHaveTextContent(
        "The card will be minted at the next The Memes mint (e.g. Wednesday / Friday / Monday)."
      );
      expect(region).not.toHaveTextContent("17:00");
      expect(region).not.toHaveTextContent("GMT");
    } finally {
      restoreZone();
    }
  });

  it.each([
    {
      zone: "America/Los_Angeles",
      now: SUMMER_MONDAY,
      local: "Mon, Wed, Fri 09:00 PDT",
    },
    {
      zone: "Pacific/Auckland",
      now: SUMMER_MONDAY,
      local: "Tue, Thu, Sat 04:00 GMT+12",
    },
    {
      zone: "Pacific/Auckland",
      now: WINTER_MONDAY,
      local: "Tue, Thu, Sat 05:00 GMT+13",
    },
  ])("shows $local for a viewer in $zone", ({ zone, now, local }) => {
    jest.spyOn(Date, "now").mockReturnValue(now);
    const restoreZone = mockDefaultTimeZone(zone);
    try {
      render(<MyStreamWaveFAQ wave={MEMES_WAVE} />);
      openVotingSection();

      expect(
        screen.getByRole("region", { name: "How Does Voting Work?" })
      ).toHaveTextContent(`at 16:00 UTC (your time: ${local})`);
    } finally {
      restoreZone();
    }
  });

  it("derives the checkpoint time from the wave's decision strategy", () => {
    render(
      <MyStreamWaveFAQ
        wave={waveWithFirstDecision(Date.UTC(2026, 6, 6, 9, 30))}
      />
    );
    openVotingSection();

    expect(
      screen.getByRole("region", { name: "How Does Voting Work?" })
    ).toHaveTextContent("Monday / Wednesday / Friday at 09:30 UTC");
  });

  it("falls back to 16:00 UTC while the wave has no decision strategy", () => {
    render(<MyStreamWaveFAQ wave={{} as unknown as ApiWave} />);
    openVotingSection();

    expect(
      screen.getByRole("region", { name: "How Does Voting Work?" })
    ).toHaveTextContent("Monday / Wednesday / Friday at 16:00 UTC");
  });

  it("scrolls an opened accordion section to the top of the FAQ container", async () => {
    const { container } = render(<MyStreamWaveFAQ wave={{} as any} />);
    const rootDiv = container.firstChild as HTMLElement;
    const scrollTo = jest.fn();

    rootDiv.scrollTop = 40;
    rootDiv.scrollTo = scrollTo;
    rootDiv.getBoundingClientRect = () => ({ top: 10 }) as DOMRect;

    const submissionButton = screen.getByRole("button", {
      name: "How Does Submission Work?",
    });
    const submissionSection = submissionButton.closest("section");

    expect(submissionSection).not.toBeNull();
    (submissionSection as HTMLElement).getBoundingClientRect = () =>
      ({ top: 210 }) as DOMRect;

    fireEvent.click(submissionButton);

    await waitFor(
      () =>
        expect(scrollTo).toHaveBeenCalledWith({
          top: 240,
          behavior: "smooth",
        }),
      { timeout: 1000 }
    );
  });
});
