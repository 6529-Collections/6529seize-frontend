import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BrainLeftSidebarWavePin from "@/components/brain/left-sidebar/waves/BrainLeftSidebarWavePin";
import {
  MAX_PINNED_WAVES,
  usePinnedWavesServer,
} from "@/hooks/usePinnedWavesServer";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { useAuth } from "@/components/auth/Auth";

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock react-tooltip
jest.mock("react-tooltip", () => ({
  Tooltip: ({ children, content, id }: any) => (
    <div data-testid={`tooltip-${id}`} role="tooltip">
      {content}
      {children}
    </div>
  ),
}));
jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg data-testid="icon" />,
}));
jest.mock("@/contexts/wave/MyStreamContext");
jest.mock("@/hooks/usePinnedWavesServer");
jest.mock("@/components/auth/Auth");

const addPinnedWave = jest.fn();
const removePinnedWave = jest.fn();
const setToast = jest.fn();

type AuthMock = {
  readonly setToast: typeof setToast;
  readonly connectedProfile: { readonly handle: string } | null;
  readonly activeProfileProxy: { readonly id: string } | null;
};

const connectedAuth: AuthMock = {
  setToast,
  connectedProfile: { handle: "testuser" },
  activeProfileProxy: null,
};
const loggedOutAuth: AuthMock = {
  setToast,
  connectedProfile: null,
  activeProfileProxy: null,
};
const proxyAuth: AuthMock = {
  setToast,
  connectedProfile: { handle: "testuser" },
  activeProfileProxy: { id: "proxy-1" },
};
const mockedUseMyStream = useMyStream as jest.Mock;
const mockedUsePinnedWavesServer = usePinnedWavesServer as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;

function setup(
  isPinned = false,
  storedPinned: string[] = [],
  canPinWave = (waveId: string) => isPinned || !storedPinned.includes(waveId),
  auth: AuthMock = connectedAuth,
  compact = false
) {
  mockedUseMyStream.mockReturnValue({
    waves: { addPinnedWave, removePinnedWave },
  });
  mockedUsePinnedWavesServer.mockReturnValue({
    pinnedIds: storedPinned,
    isOperationInProgress: jest.fn().mockReturnValue(false),
    canPinWave: jest.fn().mockImplementation(canPinWave),
  });
  mockedUseAuth.mockReturnValue(auth);
  return render(
    <BrainLeftSidebarWavePin waveId="1" isPinned={isPinned} compact={compact} />
  );
}

describe("BrainLeftSidebarWavePin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 0,
    });
    localStorage.clear();
  });

  it("does not render pin button for logged-out users", () => {
    const { container } = setup(false, [], undefined, loggedOutAuth);
    expect(container.firstChild).toBeNull();
    expect(
      screen.queryByRole("button", { name: /pin wave/i })
    ).not.toBeInTheDocument();
  });

  it("does not render pin button for proxy users", () => {
    const { container } = setup(false, [], undefined, proxyAuth);
    expect(container.firstChild).toBeNull();
    expect(
      screen.queryByRole("button", { name: /pin wave/i })
    ).not.toBeInTheDocument();
  });

  it("unpins wave when already pinned", async () => {
    const user = userEvent.setup();
    setup(true, ["1"]);
    await user.click(screen.getByRole("button", { name: /unpin wave/i }));
    expect(removePinnedWave).toHaveBeenCalledWith("1");
    expect(addPinnedWave).not.toHaveBeenCalled();
  });

  it("pins wave when under max limit", async () => {
    const user = userEvent.setup();
    setup(false, []);
    await user.click(screen.getByRole("button", { name: /pin wave/i }));
    expect(addPinnedWave).toHaveBeenCalledWith("1");
    expect(removePinnedWave).not.toHaveBeenCalled();
  });

  it("collapses compact desktop row width until hover or keyboard focus", () => {
    setup(false, [], undefined, connectedAuth, true);
    const button = screen.getByRole("button", { name: /pin wave/i });

    expect(button).toHaveClass("tw-h-7");
    expect(button).toHaveClass("tw-w-0");
    expect(button).toHaveClass("group-hover:tw-w-7");
    expect(button).toHaveClass("group-focus-within:tw-w-7");
    expect(button).toHaveClass("focus-visible:tw-w-7");
    expect(button.querySelector("svg")).toHaveClass("tw-size-3.5");
  });

  it("hides pinned desktop controls until row hover or keyboard focus", () => {
    setup(true, ["1"]);
    const button = screen.getByRole("button", { name: /unpin wave/i });

    expect(button).toHaveClass("tw-opacity-0");
    expect(button).toHaveClass("group-hover:tw-opacity-100");
    expect(button).toHaveClass("group-focus-within:tw-opacity-100");
    expect(button).toHaveClass("focus-visible:tw-opacity-100");
  });

  it("keeps pinned touch controls visible", () => {
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 1,
    });
    setup(true, ["1"]);
    const button = screen.getByRole("button", { name: /unpin wave/i });

    expect(button).toHaveClass("tw-opacity-100");
    expect(button).toHaveClass("tw-size-7");
  });

  it("shows tooltip and does not pin when max limit reached", async () => {
    const user = userEvent.setup();
    const maxList = Array(MAX_PINNED_WAVES).fill("x");
    setup(false, maxList, () => false);
    await user.click(screen.getByRole("button", { name: /pin wave/i }));
    expect(addPinnedWave).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      type: "error",
      message: `Maximum ${MAX_PINNED_WAVES} pinned waves allowed`,
    });
    expect(screen.getByRole("button", { name: /pin wave/i })).toHaveAttribute(
      "data-tooltip-content",
      `Max ${MAX_PINNED_WAVES} pinned waves. Unpin another wave first.`
    );
  });
});
