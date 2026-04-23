import React from "react";
import { render, screen } from "@testing-library/react";
import ParticipationDrop from "@/components/waves/drops/participation/ParticipationDrop";
import { DropLocation } from "@/components/waves/drops/drop.types";

const useWaveParticipationRendererSet = jest.fn();

jest.mock(
  "@/components/waves/drops/participation/participationRendererRegistry",
  () => ({
    useWaveParticipationRendererSet: (...args: any[]) =>
      useWaveParticipationRendererSet(...args),
  })
);

describe("ParticipationDrop", () => {
  beforeEach(() => {
    useWaveParticipationRendererSet.mockReset();
  });

  it("delegates to the resolved renderer", () => {
    useWaveParticipationRendererSet.mockReturnValue({
      variant: "quorum",
      ParticipationDrop: (props: any) => (
        <div data-testid="resolved-renderer">{props.drop.id}</div>
      ),
      SingleWaveDrop: () => null,
    });

    render(
      <ParticipationDrop
        drop={{ id: "drop-1", wave: { id: "quorum-wave" } } as any}
        showWaveInfo={false}
        activeDrop={null}
        showReplyAndQuote={false}
        location={DropLocation.WAVE}
        onReply={jest.fn()}
        onQuoteClick={jest.fn()}
      />
    );

    expect(useWaveParticipationRendererSet).toHaveBeenCalledWith("quorum-wave");
    expect(screen.getByTestId("resolved-renderer")).toHaveTextContent("drop-1");
  });
});
