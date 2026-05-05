import MyStreamWaveChat from "@/components/brain/my-stream/MyStreamWaveChat";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { editSlice } from "@/store/editSlice";
import { configureStore } from "@reduxjs/toolkit";
import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";

const replaceMock = jest.fn();
const searchParamsMock = { get: jest.fn(), toString: jest.fn() };
const mockSetUnreadDividerSerialNo = jest.fn();
const mockRemoveWaveDeliveredNotifications = jest
  .fn()
  .mockResolvedValue(undefined);
const mockRemoveAllDeliveredNotifications = jest
  .fn()
  .mockResolvedValue(undefined);
const invalidateNotificationsMock = jest.fn();
const mockUseAuth = jest.fn();
const mockApprovalStatus = jest.fn();

let documentVisibilityState: DocumentVisibilityState = "visible";

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  documentVisibilityState = state;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => documentVisibilityState,
  });
};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
  usePathname: jest.fn(),
}));

let mockIsMemesWave = false;
let mockIsCurationWave = false;
jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({
    isMemesWave: mockIsMemesWave,
    isCurationWave: mockIsCurationWave,
  }),
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: (args: any) => mockApprovalStatus(args),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ waveViewStyle: { height: "1px" } }),
}));

const capturedPropsHolder = { current: {} as any };
const capturedCreatorPropsHolder = { current: {} as any };
const capturedMemesButtonPropsHolder = { current: {} as any };
jest.mock("@/components/waves/drops/wave-drops-all", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedPropsHolder.current = props;
    return <div data-testid="drops" />;
  },
  WaveDropsAllWithoutProvider: (props: any) => {
    capturedPropsHolder.current = props;
    return <div data-testid="drops" />;
  },
}));

jest.mock("@/components/waves/CreateDropWaveWrapper", () => ({
  CreateDropWaveWrapper: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/waves/PrivilegedDropCreator", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedCreatorPropsHolder.current = props;
    return <div data-testid="creator" data-mode={props.fixedDropMode} />;
  },
  DropMode: { BOTH: "BOTH", CHAT: "CHAT" },
}));

jest.mock(
  "@/components/waves/memes/submission/MobileMemesArtSubmissionBtn",
  () => ({
    __esModule: true,
    default: (props: any) => {
      capturedMemesButtonPropsHolder.current = props;
      return (
        <div
          data-testid="memes-btn"
          data-locked={String(props.isSubmissionLocked)}
        />
      );
    },
  })
);

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock("@/contexts/wave/UnreadDividerContext", () => ({
  UnreadDividerProvider: ({ children }: any) => <>{children}</>,
  useUnreadDivider: () => ({
    setUnreadDividerSerialNo: mockSetUnreadDividerSerialNo,
  }),
}));

jest.mock("@/components/waves/gallery", () => ({
  WaveGallery: () => <div data-testid="gallery" />,
}));

jest.mock("@/components/notifications/NotificationsContext", () => ({
  useNotificationsContext: () => ({
    removeWaveDeliveredNotifications: mockRemoveWaveDeliveredNotifications,
    removeAllDeliveredNotifications: mockRemoveAllDeliveredNotifications,
  }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xAAA" }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => "test-jwt",
}));

jest.mock("jwt-decode", () => ({
  jwtDecode: (token: string) => {
    if (token !== "test-jwt") {
      throw new Error(`Unexpected JWT decode for ${token}`);
    }

    return { sub: "0xAAA", role: null };
  },
}));

const wave = {
  id: "10",
  participation: {},
  metrics: { muted: false, your_unread_drops_count: 0 },
  wave: { type: ApiWaveType.Rank, winning_threshold: null },
} as any;
const mockOnDropClick = jest.fn();

describe("MyStreamWaveChat", () => {
  let store: any;

  beforeEach(() => {
    setDocumentVisibilityState("visible");
    capturedPropsHolder.current = {};
    capturedCreatorPropsHolder.current = {};
    capturedMemesButtonPropsHolder.current = {};
    replaceMock.mockClear();
    searchParamsMock.get.mockReset();
    searchParamsMock.toString.mockReset();
    searchParamsMock.toString.mockReturnValue("");
    mockIsMemesWave = false;
    mockIsCurationWave = false;
    mockOnDropClick.mockClear();
    mockSetUnreadDividerSerialNo.mockClear();
    mockRemoveWaveDeliveredNotifications.mockClear();
    mockRemoveAllDeliveredNotifications.mockClear();
    invalidateNotificationsMock.mockClear();
    mockApprovalStatus.mockReset();
    mockApprovalStatus.mockReturnValue({
      winningThreshold: null,
      isVotingClosed: false,
      isVotingControlsLocked: false,
    });
    mockUseAuth.mockReturnValue({
      connectedProfile: { handle: "tester" },
      activeProfileProxy: null,
    });
    (
      commonApiPostWithoutBodyAndResponse as jest.MockedFunction<
        typeof commonApiPostWithoutBodyAndResponse
      >
    ).mockClear();
    store = configureStore({
      reducer: { edit: editSlice.reducer },
    });
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications: invalidateNotificationsMock } as any}
      >
        <Provider store={store}>{component}</Provider>
      </ReactQueryWrapperContext.Provider>
    );
  };

  it("handles serialNo param and shows memes button", async () => {
    searchParamsMock.get.mockReturnValueOnce("5").mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("serialNo=5");
    mockIsMemesWave = true;
    await act(async () => {
      renderWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
        />
      );
    });
    expect(replaceMock).toHaveBeenCalled();
    expect(capturedPropsHolder.current.initialDrop).toBe(5);
    expect(screen.getByTestId("memes-btn")).toBeInTheDocument();
  });

  it("sets initialDrop null when no param", async () => {
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");
    await act(async () => {
      renderWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
        />
      );
    });
    expect(replaceMock).not.toHaveBeenCalled();
    expect(capturedPropsHolder.current.initialDrop).toBeNull();
    expect(capturedCreatorPropsHolder.current.fixedDropMode).toBe("BOTH");
    expect(screen.queryByTestId("memes-btn")).toBeNull();
  });

  it("locks approve submissions while keeping drop status open during status locks", async () => {
    const approveWave = {
      ...wave,
      wave: {
        type: ApiWaveType.Approve,
        winning_threshold: 12,
        max_winners: 1,
        no_of_decisions_done: 1,
      },
    };

    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");
    mockIsMemesWave = true;
    mockApprovalStatus.mockReturnValue({
      winningThreshold: 12,
      isVotingClosed: false,
      isVotingControlsLocked: true,
    });

    await act(async () => {
      renderWithProvider(
        <MyStreamWaveChat
          wave={approveWave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
        />
      );
    });

    expect(capturedPropsHolder.current.winningThreshold).toBe(12);
    expect(capturedPropsHolder.current.isVotingClosed).toBe(false);
    expect(capturedPropsHolder.current.isVotingControlsLocked).toBe(true);
    expect(capturedCreatorPropsHolder.current.fixedDropMode).toBe("CHAT");
    expect(capturedMemesButtonPropsHolder.current.isSubmissionLocked).toBe(
      true
    );
  });

  it("keeps serialNo until chat view renders", async () => {
    searchParamsMock.get.mockImplementation((key: string) =>
      key === "serialNo" ? "5" : null
    );
    searchParamsMock.toString.mockReturnValue("serialNo=5");

    const { rerender } = renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="gallery"
        onDropClick={mockOnDropClick}
      />
    );

    expect(screen.getByTestId("gallery")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications: invalidateNotificationsMock } as any}
      >
        <Provider store={store}>
          <MyStreamWaveChat
            wave={wave}
            firstUnreadSerialNo={null}
            viewMode="chat"
            onDropClick={mockOnDropClick}
          />
        </Provider>
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(capturedPropsHolder.current.initialDrop).toBe(5);
    });
  });

  it("invalidates notifications on unmount", async () => {
    searchParamsMock.get.mockReturnValueOnce("5").mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("serialNo=5");

    const { unmount } = renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
      />
    );

    await act(async () => {
      unmount();
    });

    await waitFor(() => {
      expect(mockRemoveWaveDeliveredNotifications).toHaveBeenCalledWith("10");
      expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
        endpoint: "notifications/wave/10/read",
        headers: { Authorization: "Bearer test-jwt" },
      });
      expect(invalidateNotificationsMock).toHaveBeenCalled();
    });
  });

  it("does not mark notifications read on hidden unmount", async () => {
    setDocumentVisibilityState("hidden");
    searchParamsMock.get.mockReturnValueOnce("5").mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("serialNo=5");

    const { unmount } = renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
      />
    );

    await act(async () => {
      unmount();
      await Promise.resolve();
    });

    expect(mockSetUnreadDividerSerialNo).toHaveBeenCalledWith(null);
    expect(mockRemoveWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotificationsMock).not.toHaveBeenCalled();
  });

  it("skips notification cleanup on unmount for anonymous viewers", async () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: null,
      activeProfileProxy: null,
    });

    const { unmount } = renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
      />
    );

    await act(async () => {
      unmount();
    });

    expect(mockRemoveWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(invalidateNotificationsMock).not.toHaveBeenCalled();
  });
});
