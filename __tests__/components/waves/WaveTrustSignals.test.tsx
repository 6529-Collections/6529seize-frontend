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
    expect(screen.getByText("+1.3K")).toBeInTheDocument();
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

    const summaryBadge = screen.getByLabelText(
      "Combined score: 83. Quality: 78. Hotness: 92. REP: +1,250 raw, 41 score"
    );

    expect(summaryBadge).toHaveAttribute(
      "title",
      "Combined score: 83\nQuality: 78\nHotness: 92\nREP: +1,250 raw, 41 score"
    );
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("83")).toBeInTheDocument();
    expect(screen.queryByText("Hot")).not.toBeInTheDocument();
    expect(screen.queryByText("REP")).not.toBeInTheDocument();
  });
});
