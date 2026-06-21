import { render, screen } from "@testing-library/react";
import type { ApiWaveRepSummary } from "@/generated/models/ApiWaveRepSummary";
import type { ApiWaveScore } from "@/generated/models/ApiWaveScore";
import { WaveTrustSignals } from "@/components/waves/WaveTrustSignals";

const waveScore = {
  visibility_score: 83,
  quality_score: 78,
  hotness_score: 92,
  rep_sort_score: 41,
} as ApiWaveScore;

const waveRep = {
  total_rep: 1250,
} as ApiWaveRepSummary;

describe("WaveTrustSignals", () => {
  it("renders all trust badges in details mode", () => {
    render(<WaveTrustSignals waveRep={waveRep} waveScore={waveScore} />);

    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Hot")).toBeInTheDocument();
    expect(screen.getByText("REP")).toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument();
    expect(screen.getByText("92")).toBeInTheDocument();
    expect(screen.getByLabelText(/Wave REP positive/)).toBeInTheDocument();
  });

  it("renders one combined score badge in summary mode", () => {
    render(
      <WaveTrustSignals
        waveRep={waveRep}
        waveScore={waveScore}
        variant="sidebar"
        mode="summary"
      />
    );

    const summaryBadge = screen.getByText("Score").closest("[aria-label]");

    expect(summaryBadge).not.toBeNull();
    expect(summaryBadge).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Combined score: 83. Quality: 78. Hotness: 92.")
    );
    expect(summaryBadge?.getAttribute("aria-label")).toMatch(
      /^Combined score: 83\. Quality: 78\. Hotness: 92\. REP: .+ raw, 41 score$/
    );
    expect(summaryBadge).toHaveAttribute(
      "title",
      expect.stringContaining("Combined score: 83\nQuality: 78\nHotness: 92")
    );
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument();
    expect(screen.queryByText("Hot")).not.toBeInTheDocument();
    expect(screen.queryByText("REP")).not.toBeInTheDocument();
  });

  it("renders sidebar summary score as an accessible details trigger", () => {
    render(
      <WaveTrustSignals
        waveRep={waveRep}
        waveScore={waveScore}
        variant="sidebar-inline"
        mode="summary"
      />
    );

    const trigger = screen.getByRole("button", {
      name: /Show wave score details/,
    });

    expect(trigger).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Combined score: 83")
    );
    expect(trigger).toHaveAttribute(
      "title",
      expect.stringContaining("Quality: 78")
    );
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument();
  });

  it("renders nothing in summary mode without a combined score", () => {
    const { container } = render(
      <WaveTrustSignals
        waveScore={
          {
            hotness_score: 92,
            rep_sort_score: 41,
          } as ApiWaveScore
        }
        variant="sidebar"
        mode="summary"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing in summary mode without score data", () => {
    const { container } = render(
      <WaveTrustSignals waveScore={null} variant="sidebar" mode="summary" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
