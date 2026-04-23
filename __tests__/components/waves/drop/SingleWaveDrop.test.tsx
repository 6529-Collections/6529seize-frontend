import { render, screen } from "@testing-library/react";
import React from "react";
import { SingleWaveDrop } from "@/components/waves/drop/SingleWaveDrop";

const useWaveParticipationRendererSet = jest.fn();

jest.mock(
  "@/components/waves/drops/participation/participationRendererRegistry",
  () => ({
    useWaveParticipationRendererSet: (...args: any[]) =>
      useWaveParticipationRendererSet(...args),
  })
);

describe("SingleWaveDrop", () => {
  const drop: any = { wave: { id: "w1" } };
  const onClose = jest.fn();

  beforeEach(() => {
    useWaveParticipationRendererSet.mockReset();
  });

  it("renders the resolved single drop renderer", () => {
    useWaveParticipationRendererSet.mockReturnValue({
      variant: "quorum",
      ParticipationDrop: () => null,
      SingleWaveDrop: () => <div data-testid="quorum" />,
    });

    render(<SingleWaveDrop drop={drop} onClose={onClose} />);

    expect(useWaveParticipationRendererSet).toHaveBeenCalledWith("w1");
    expect(screen.getByTestId("quorum")).toBeInTheDocument();
  });
});
