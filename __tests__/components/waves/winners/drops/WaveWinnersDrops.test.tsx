import React from "react";
import { render, screen } from "@testing-library/react";
import { WaveWinnersDrops } from "@/components/waves/winners/drops/WaveWinnersDrops";

const mockWaveWinnersDrop = jest.fn((props: any) => (
  <div data-testid={`drop-${props.winner.drop.id}`} />
));

jest.mock("@/components/waves/winners/drops/WaveWinnersDrop", () => ({
  WaveWinnersDrop: (props: any) => mockWaveWinnersDrop(props),
}));

describe("WaveWinnersDrops", () => {
  const wave = { id: "w1" } as any;
  const winners = [{ drop: { id: "d1" } }, { drop: { id: "d2" } }] as any;

  beforeEach(() => {
    mockWaveWinnersDrop.mockClear();
  });

  it("shows loading bar when loading", () => {
    render(
      <WaveWinnersDrops
        wave={wave}
        winners={[]}
        onDropClick={jest.fn()}
        isLoading
      />
    );
    expect(
      document.querySelector(".tw-animate-loading-bar")
    ).toBeInTheDocument();
  });

  it("returns empty fragment when no winners", () => {
    const { container } = render(
      <WaveWinnersDrops wave={wave} winners={[]} onDropClick={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows custom empty text when provided", () => {
    render(
      <WaveWinnersDrops
        wave={wave}
        winners={[]}
        onDropClick={jest.fn()}
        emptyMessage="No drops approved yet"
      />
    );

    expect(screen.getByText("No drops approved yet")).toBeInTheDocument();
  });

  it("renders a drop component for each winner", () => {
    render(
      <WaveWinnersDrops wave={wave} winners={winners} onDropClick={jest.fn()} />
    );
    expect(screen.getByTestId("drop-d1")).toBeInTheDocument();
    expect(screen.getByTestId("drop-d2")).toBeInTheDocument();
  });

  it("forwards content presentation to each drop", () => {
    render(
      <WaveWinnersDrops
        wave={wave}
        winners={winners}
        onDropClick={jest.fn()}
        contentPresentation="quorumCompact"
      />
    );

    expect(mockWaveWinnersDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPresentation: "quorumCompact",
      })
    );
  });

  it("skips winners without drop data and shows a dev warning", () => {
    render(
      <WaveWinnersDrops
        wave={wave}
        winners={[{ drop: { id: "d1" } }, { place: 2 } as any]}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("drop-d1")).toBeInTheDocument();
    expect(
      screen.getByText("Hidden 1 winner with missing drop data.")
    ).toBeInTheDocument();
  });
});
