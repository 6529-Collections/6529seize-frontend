import LazySingleWaveDrop from "@/components/waves/drop/LazySingleWaveDrop";
import { render, screen } from "@testing-library/react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

// These tests share one module registry on purpose: the first one must run
// while the single drop view chunk is still unloaded. The order is meaningful.
jest.mock("@/components/waves/drop/SingleWaveDrop", () => ({
  SingleWaveDrop: ({ onClose }: { readonly onClose: () => void }) => (
    <button type="button" data-testid="single-drop" onClick={onClose}>
      view
    </button>
  ),
}));

const drop = { id: "drop-1", wave: { id: "wave-1" } } as ExtendedDrop;

describe("LazySingleWaveDrop", () => {
  it("shows a named loading status while the view loads, then the view", async () => {
    render(<LazySingleWaveDrop drop={drop} onClose={jest.fn()} />);

    // No awaiting yet: the chunk cannot have arrived.
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Loading…");
    expect(screen.queryByTestId("single-drop")).toBeNull();

    expect(await screen.findByTestId("single-drop")).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders the view in the first pass once its chunk is cached", () => {
    // Nothing below awaits: the previous test loaded the chunk.
    render(<LazySingleWaveDrop drop={drop} onClose={jest.fn()} />);

    expect(screen.getByTestId("single-drop")).toBeVisible();
    expect(screen.queryByRole("status")).toBeNull();
  });
});
