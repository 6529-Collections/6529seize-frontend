import { fireEvent, render, screen } from "@testing-library/react";
import QuickDirectMessages from "@/components/messages/quick-dms/QuickDirectMessages";
import {
  LIST_STATE,
  QUICK_DM_STORAGE_KEY,
} from "@/components/messages/quick-dms/QuickDirectMessagesUtils";

const mockReleaseDirectMessagesList = jest.fn();
const mockRequestDirectMessagesList = jest.fn(
  () => mockReleaseDirectMessagesList
);

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { handle: "alice" },
    showWaves: true,
  }),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false, isMobileDevice: false }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    directMessages: {
      list: [],
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    },
    registerWave: jest.fn(),
    requestDirectMessagesList: mockRequestDirectMessagesList,
  }),
}));

jest.mock("@/components/waves/drops/WaveDropsScrollControlsVisibility", () => ({
  useWaveDropsScrollControlsVisible: () => false,
}));

jest.mock("@/components/waves/WaveComposerDockVisibility", () => ({
  useWaveComposerDockElements: () => [],
  isAnyDockInsideRightEdgeClearance: () => false,
}));

jest.mock("@/services/dm-unread/DmUnreadStateProvider", () => ({
  useDmUnreadSummary: () => ({ totalUnreadMessages: 3 }),
  useDmUnreadConversation: () => undefined,
}));

jest.mock("@/components/waves/create-dm/CreateDirectMessageModal", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/messages/quick-dms/QuickDmChat", () => ({
  QuickDmChat: () => <div data-testid="quick-dm-chat" />,
}));

jest.mock("@/components/messages/quick-dms/QuickDmListPanel", () => ({
  QuickDmListPanel: ({ onClose }: { readonly onClose: () => void }) => (
    <button type="button" data-testid="quick-dm-list" onClick={onClose}>
      Close list
    </button>
  ),
}));

const setDesktopViewport = (): void => {
  Object.defineProperty(globalThis.window, "matchMedia", {
    configurable: true,
    value: jest.fn((query: string) => ({
      addEventListener: jest.fn(),
      addListener: jest.fn(),
      dispatchEvent: jest.fn(),
      matches: true,
      media: query,
      onchange: null,
      removeEventListener: jest.fn(),
      removeListener: jest.fn(),
    })),
  });
};

describe("QuickDirectMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.localStorage.clear();
    setDesktopViewport();
  });

  it("keeps the DM list idle while only the launcher is shown", () => {
    render(<QuickDirectMessages />);

    expect(
      screen.getByRole("button", { name: /Open quick direct messages/ })
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(mockRequestDirectMessagesList).not.toHaveBeenCalled();
  });

  it("loads the DM list while the panel is open and releases it on close", () => {
    render(<QuickDirectMessages />);

    fireEvent.click(
      screen.getByRole("button", { name: /Open quick direct messages/ })
    );

    expect(screen.getByTestId("quick-dm-list")).toBeInTheDocument();
    expect(mockRequestDirectMessagesList).toHaveBeenCalledTimes(1);
    expect(mockReleaseDirectMessagesList).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("quick-dm-list"));

    expect(
      screen.getByRole("button", { name: /Open quick direct messages/ })
    ).toBeInTheDocument();
    // The closed launcher keeps its unread badge without the DM list.
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(mockReleaseDirectMessagesList).toHaveBeenCalledTimes(1);
    expect(mockRequestDirectMessagesList).toHaveBeenCalledTimes(1);
  });

  it("loads the DM list on mount when the panel was left open", () => {
    globalThis.localStorage.setItem(
      QUICK_DM_STORAGE_KEY,
      JSON.stringify(LIST_STATE)
    );

    render(<QuickDirectMessages />);

    expect(screen.getByTestId("quick-dm-list")).toBeInTheDocument();
    expect(mockRequestDirectMessagesList).toHaveBeenCalledTimes(1);
  });
});
