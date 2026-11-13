import { render, screen } from "@testing-library/react";
import React from "react";
import { SingleWaveDrop } from "@/components/waves/drop/SingleWaveDrop";

const useWaveSingleWaveDropRendererSet = jest.fn();

jest.mock("@/components/waves/drop/singleWaveDropRendererRegistry", () => ({
  useWaveSingleWaveDropRendererSet: (...args: any[]) =>
    useWaveSingleWaveDropRendererSet(...args),
}));

describe("SingleWaveDrop", () => {
  const drop: any = { id: "drop-1", wave: { id: "w1" } };
  const onClose = jest.fn();

  beforeEach(() => {
    useWaveSingleWaveDropRendererSet.mockReset();
  });

  it("renders the resolved single drop renderer", () => {
    useWaveSingleWaveDropRendererSet.mockReturnValue({
      SingleWaveDrop: () => <div data-testid="quorum" />,
    });

    render(<SingleWaveDrop drop={drop} onClose={onClose} />);

    expect(useWaveSingleWaveDropRendererSet).toHaveBeenCalledWith(
      "w1",
      undefined
    );
    expect(screen.getByTestId("quorum")).toBeInTheDocument();
  });
});
