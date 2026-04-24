import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PinnedWavesScroller from "@/components/brain/content/pinned-waves/subcomponents/PinnedWavesScroller";
import type { PinnedWaveSnapshot } from "@/hooks/usePinnedWaves";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

jest.mock("@/components/brain/content/BrainContentPinnedWave", () => ({
  __esModule: true,
  default: ({ wave, onMouseEnter, onMouseLeave, onRemove }: any) => (
    <div>
      <button
        type="button"
        data-testid={`hover-${wave.id}`}
        onMouseEnter={() => onMouseEnter(wave.id)}
        onMouseLeave={onMouseLeave}
      >
        hover {wave.id}
      </button>
      <button
        type="button"
        data-testid={`remove-${wave.id}`}
        onClick={() => onRemove(wave.id)}
      >
        remove {wave.id}
      </button>
    </div>
  ),
}));

const baseWave = (
  overrides: Partial<PinnedWaveSnapshot> = {}
): PinnedWaveSnapshot => ({
  id: "wave-1",
  name: "Wave 1",
  picture: null,
  contributors: [],
  isDirectMessage: false,
  type: ApiWaveType.Chat,
  fetchedAt: Date.now(),
  ...overrides,
});

describe("PinnedWavesScroller", () => {
  const onHoverWave = jest.fn();
  const onHoverExit = jest.fn();
  const onRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    });
    (global as any).MutationObserver = class {
      observe() {}
      disconnect() {}
    };
    (global as any).ResizeObserver = class {
      observe() {}
      disconnect() {}
    };
  });

  it("hides scroll buttons on coarse pointers and forwards child handlers", async () => {
    const user = userEvent.setup();

    render(
      <PinnedWavesScroller
        pinnedWaves={[baseWave()]}
        currentWaveId={null}
        hoveredWaveId={null}
        onHoverWave={onHoverWave}
        onHoverExit={onHoverExit}
        onRemove={onRemove}
      />
    );

    expect(
      screen.queryByRole("button", { name: "Scroll left" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Scroll right" })
    ).not.toBeInTheDocument();

    await user.hover(screen.getByTestId("hover-wave-1"));
    expect(onHoverWave).toHaveBeenCalledWith("wave-1");

    await user.unhover(screen.getByTestId("hover-wave-1"));
    expect(onHoverExit).toHaveBeenCalled();

    await user.click(screen.getByTestId("remove-wave-1"));
    expect(onRemove).toHaveBeenCalledWith("wave-1");
  });
});
