import { act, render } from "@testing-library/react";
import { QuickDmChat } from "@/components/messages/quick-dms/QuickDmChat";

const markWaveRead = jest.fn(() => 4);
const restoreWaveUnreadCount = jest.fn();
const markWaveNotificationsRead = jest.fn();
let mockUnreadCount = 4;

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    directMessages: { markWaveRead, restoreWaveUnreadCount },
    registerWave: jest.fn(),
  }),
}));

jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({ updateEligibility: jest.fn() }),
}));

jest.mock("@/hooks/useMarkWaveNotificationsRead", () => ({
  useMarkWaveNotificationsRead: () => markWaveNotificationsRead,
}));

jest.mock("@/hooks/useWaveData", () => ({
  useWaveData: () => ({ data: null, isFetching: true, isError: false }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));

jest.mock("@/components/brain/my-stream/MyStreamWaveChat", () => () => null);

jest.mock("@/components/messages/quick-dms/QuickDmPanelPieces", () => ({
  QuickDmHeaderAvatar: () => null,
  QuickDmLoadingRows: () => <div>loading</div>,
  QuickDmPanelHeader: () => null,
}));

jest.mock("@/components/messages/quick-dms/QuickDirectMessagesUtils", () => ({
  getFormattedWaveName: () => "DM",
  getQuickDmAvatarSource: () => null,
  getUnreadCount: () => mockUnreadCount,
}));

const createChat = () => (
  <QuickDmChat
    hasUnreadOutsideCurrentChat={false}
    listWave={{ id: "wave-1" } as any}
    locale="en"
    onBack={jest.fn()}
    onClose={jest.fn()}
    onOpenAll={jest.fn()}
    waveId="wave-1"
  />
);

const renderChat = () => render(createChat());

describe("QuickDmChat read state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUnreadCount = 4;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("restores the unread count when marking read is skipped", async () => {
    markWaveNotificationsRead.mockResolvedValue("skipped");

    const view = renderChat();
    await act(async () => Promise.resolve());

    expect(markWaveRead).toHaveBeenCalledWith("wave-1");
    expect(restoreWaveUnreadCount).toHaveBeenCalledWith("wave-1", 4);

    mockUnreadCount = 0;
    view.rerender(createChat());
    mockUnreadCount = 4;
    view.rerender(createChat());
    await act(async () => Promise.resolve());
    expect(markWaveNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it("restores the unread count when marking read fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    markWaveNotificationsRead.mockRejectedValue(new Error("network"));

    renderChat();
    await act(async () => Promise.resolve());

    expect(restoreWaveUnreadCount).toHaveBeenCalledWith("wave-1", 4);
    consoleError.mockRestore();
  });
});
