import LazySingleWaveDrop from "@/components/waves/drop/LazySingleWaveDrop";
import { singleWaveDropLoader } from "@/components/waves/drop/singleWaveDropLoader";
import { act, render, screen } from "@testing-library/react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

// Its own file, so the view chunk is fetched by a preload and by nothing else
// before the drop opens: the path where the drop is requested and the chunk is
// fetched while the drop itself is still loading.
jest.mock("@/components/waves/drop/SingleWaveDrop", () => ({
  SingleWaveDrop: () => <div data-testid="single-drop" />,
}));

describe("LazySingleWaveDrop after its chunk was preloaded", () => {
  it("renders the view with no placeholder frame", async () => {
    singleWaveDropLoader.preload();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    render(
      <LazySingleWaveDrop
        drop={{ id: "drop-1", wave: { id: "wave-1" } } as ExtendedDrop}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByTestId("single-drop")).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
