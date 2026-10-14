import LazyWaveDropsSearchModal from "@/components/waves/drops/search/LazyWaveDropsSearchModal";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Its own file so the modal chunk is still unloaded when the test starts.
let mockWaveModalLoads = 0;

jest.mock("@/components/waves/drops/search/WaveDropsSearchModal", () => {
  mockWaveModalLoads += 1;
  return {
    __esModule: true,
    default: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div role="dialog" aria-label="Wave search" /> : null,
  };
});

const wave = { id: "wave-1", name: "Design Wave" } as any;

describe("LazyWaveDropsSearchModal Escape while loading", () => {
  it("closes on Escape only, and stops listening once closed while the chunk is still loading", async () => {
    const onClose = jest.fn();
    const props = { onClose, wave, onSelectSerialNo: jest.fn() };
    const { rerender } = render(<LazyWaveDropsSearchModal isOpen {...props} />);
    expect(mockWaveModalLoads).toBe(0);

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    // The owner reacts to onClose by closing; the chunk is still in flight.
    rerender(<LazyWaveDropsSearchModal isOpen={false} {...props} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(mockWaveModalLoads).toBe(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
