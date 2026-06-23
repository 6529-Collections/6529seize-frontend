import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MyStreamWaveTab } from "@/types/waves.types";

const setActiveContentTab = jest.fn();

jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ setActiveContentTab }),
}));

const useLayoutMock = jest.fn();
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => useLayoutMock(),
}));

import MyStreamWaveFAQ from "@/components/brain/my-stream/MyStreamWaveFAQ";

describe("MyStreamWaveFAQ", () => {
  beforeEach(() => {
    setActiveContentTab.mockClear();
    useLayoutMock.mockReturnValue({ faqViewStyle: { height: "21px" } });
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
