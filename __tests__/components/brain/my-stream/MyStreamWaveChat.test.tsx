import MyStreamWaveChat from "@/components/brain/my-stream/MyStreamWaveChat";
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
  usePathname: jest.fn(),
}));

let mockIsMemesWave = false;
jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({ isMemesWave: mockIsMemesWave }),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ waveViewStyle: { height: "1px" } }),
}));

const capturedPropsHolder = { current: {} as any };
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
  default: () => <div data-testid="creator" />,
  DropMode: { BOTH: "BOTH" },
}));

jest.mock(
  "@/components/waves/memes/submission/MobileMemesArtSubmissionBtn",
  () => ({
    __esModule: true,
    default: () => <div data-testid="memes-btn" />,
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

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

const wave = { id: "10", metrics: { muted: false } } as any;
const mockOnDropClick = jest.fn();

describe("MyStreamWaveChat", () => {
  let store: any;

  beforeEach(() => {
    capturedPropsHolder.current = {};
    replaceMock.mockClear();
    searchParamsMock.get.mockReset();
    searchParamsMock.toString.mockReset();
    searchParamsMock.toString.mockReturnValue("");
    mockIsMemesWave = false;
    mockOnDropClick.mockClear();
    mockSetUnreadDividerSerialNo.mockClear();
    mockRemoveWaveDeliveredNotifications.mockClear();
    mockRemoveAllDeliveredNotifications.mockClear();
    invalidateNotificationsMock.mockClear();
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
    expect(screen.queryByTestId("memes-btn")).toBeNull();
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
      });
      expect(invalidateNotificationsMock).toHaveBeenCalled();
    });
  });
});
