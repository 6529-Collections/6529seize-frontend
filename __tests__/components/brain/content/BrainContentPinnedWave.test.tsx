import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PinnedWaveSnapshot } from "@/hooks/usePinnedWaves";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const prefetch = jest.fn();
jest.mock("@/hooks/usePrefetchWaveData", () => ({
  usePrefetchWaveData: () => prefetch,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

const registerWave = jest.fn();
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({ registerWave }),
}));

jest.mock("@/hooks/isMobileDevice", () => jest.fn(() => false));

const wave: PinnedWaveSnapshot = {
  id: "1",
  name: "Wave 1",
  picture: "pic.png",
  contributors: [{ pfp: "pfp1.png", identity: "alice" }],
  isDirectMessage: false,
  fetchedAt: 123,
};

jest.mock("@/components/waves/WavePicture", () => ({
  __esModule: true,
  default: ({ name }: any) => <div data-testid="picture">{name}</div>,
}));

import BrainContentPinnedWave from "@/components/brain/content/BrainContentPinnedWave";
import useIsMobileDevice from "@/hooks/isMobileDevice";

describe("BrainContentPinnedWave", () => {
  const onMouseEnter = jest.fn();
  const onMouseLeave = jest.fn();
  const onRemove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsMobileDevice as jest.Mock).mockReturnValue(false);
  });

  function renderComponent({
    active = false,
    currentWaveId = "2",
    pinnedWave = wave,
  }: {
    active?: boolean;
    currentWaveId?: string | null;
    pinnedWave?: PinnedWaveSnapshot;
  } = {}) {
    return render(
      <BrainContentPinnedWave
        wave={pinnedWave}
        currentWaveId={currentWaveId}
        active={active}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onRemove={onRemove}
      />
    );
  }

  it("renders wave info and handles interactions", async () => {
    const user = userEvent.setup();
    const { container } = renderComponent();

    expect(screen.getAllByText("Wave 1").length).toBeGreaterThan(0);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/waves/1");

    await user.hover(container.firstChild as HTMLElement);
    expect(onMouseEnter).toHaveBeenCalledWith("1");
    expect(registerWave).toHaveBeenCalledWith("1");
    expect(prefetch).toHaveBeenCalledWith("1");

    await user.click(screen.getByRole("button", { name: /Remove wave/i }));
    expect(onRemove).toHaveBeenCalledWith("1");

    await user.click(screen.getByRole("link"));
    expect(onMouseLeave).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/waves/1");
  });

  it("uses waves route when viewing active wave and skips prefetch", async () => {
    const user = userEvent.setup();
    const { container } = renderComponent({ currentWaveId: "1" });

    expect(screen.getByRole("link")).toHaveAttribute("href", "/waves");

    await user.hover(container.firstChild as HTMLElement);
    expect(onMouseEnter).toHaveBeenCalledWith("1");
    expect(registerWave).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });

  it("falls back to the wave id when the name is blank", () => {
    renderComponent({
      pinnedWave: {
        ...wave,
        id: "abcdef123456",
        name: "   ",
      },
    });

    expect(screen.getAllByText("abcdef12").length).toBeGreaterThan(0);
  });
});
