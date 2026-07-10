import MyStreamWaveChat from "@/components/brain/my-stream/MyStreamWaveChat";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { EditingDropProvider } from "@/contexts/EditingDropContext";
import {
  WsMessageType,
  type WsDropDeleteMessage,
} from "@/helpers/Types";
import { REPLY_TARGET_UNAVAILABLE_TOAST_ID } from "@/components/waves/create-drop-content/reply-target-unavailable";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

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
const mockFetchAroundSerialNo = jest.fn();
const mockSetToast = jest.fn();
const mockUseWebSocketMessage = jest.fn();

let documentVisibilityState: DocumentVisibilityState = "visible";

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  documentVisibilityState = state;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => documentVisibilityState,
  });
};

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: (loader: () => unknown) => {
    const loaderSource = loader.toString();

    if (loaderSource.includes("@/components/waves/gallery")) {
      return require("@/components/waves/gallery").WaveGallery;
    }

    if (loaderSource.includes("@/components/waves/PrivilegedDropCreator")) {
      return require("@/components/waves/PrivilegedDropCreator").default;
    }

    if (loaderSource.includes("./WaveChatSubmitDropModal")) {
      return require("@/components/brain/my-stream/WaveChatSubmitDropModal")
        .WaveChatSubmitDropModal;
    }

    if (
      loaderSource.includes(
        "@/components/waves/leaderboard/create/WaveDropCreate"
      )
    ) {
      return require("@/components/waves/leaderboard/create/WaveDropCreate")
        .WaveDropCreate;
    }

    if (
      loaderSource.includes(
        "@/components/waves/leaderboard/create/WaveLeaderboardCurationDropModal"
      )
    ) {
      return require("@/components/waves/leaderboard/create/WaveLeaderboardCurationDropModal")
        .WaveLeaderboardCurationDropModal;
    }

    throw new Error(
      `Unexpected next/dynamic import in MyStreamWaveChat test: ${loaderSource}`
    );
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => searchParamsMock,
  usePathname: jest.fn(),
}));

let mockIsMemesWave = false;
let mockIsCurationWave = false;
let mockIsQuorumWave = false;
jest.mock("@/hooks/useWave", () => ({
  useWave: () => ({
    isMemesWave: mockIsMemesWave,
    isCurationWave: mockIsCurationWave,
    isQuorumWave: mockIsQuorumWave,
  }),
}));

jest.mock("@/hooks/waves/useApprovalWaveStatus", () => ({
  useApprovalWaveStatus: (args: any) => mockApprovalStatus(args),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ waveViewStyle: { height: "1px" } }),
}));

const capturedPropsHolder = { current: {} as any };
const capturedCreatorPropsHolder = {
  current: {} as any,
  all: [] as any[],
};
const PREFILL_URL =
  "https://opensea.io/item/ethereum/0x1234567890abcdef1234567890abcdef12345678/123";
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
    capturedCreatorPropsHolder.all.push(props);
    return (
      <div data-testid="creator" data-mode={props.fixedDropMode}>
        {props.onAllDropsAdded && (
          <button
            type="button"
            data-testid={`creator-success-${props.fixedDropMode}`}
            onClick={props.onAllDropsAdded}
          >
            success
          </button>
        )}
        {props.onSubmitCurationUrl && props.canSubmitCurationUrl !== false && (
          <button
            type="button"
            data-testid="submit-curation-url"
            onClick={() => props.onSubmitCurationUrl(PREFILL_URL)}
          >
            Submit it as a drop
          </button>
        )}
        {props.canSubmitCurationUrl === false &&
          props.curationUrlSubmitRestrictionMessage && (
            <p data-testid="curation-submit-restriction">
              {props.curationUrlSubmitRestrictionMessage}
            </p>
          )}
      </div>
    );
  },
  DropMode: { BOTH: "BOTH", CHAT: "CHAT", PARTICIPATION: "PARTICIPATION" },
}));

let mockIsApp = false;
jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: mockIsApp }),
}));

jest.mock("@/contexts/wave/UnreadDividerContext", () => ({
  UnreadDividerProvider: ({ children }: any) => <>{children}</>,
  useUnreadDivider: () => ({
    setUnreadDividerSerialNo: mockSetUnreadDividerSerialNo,
  }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: () => ({
    fetchAroundSerialNo: mockFetchAroundSerialNo,
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

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (...args: unknown[]) => mockUseWebSocketMessage(...args),
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

    return { sub: "0xAAA", role: null, exp: 4102444800 };
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
  beforeEach(() => {
    setDocumentVisibilityState("visible");
    capturedPropsHolder.current = {};
    capturedCreatorPropsHolder.current = {};
    capturedCreatorPropsHolder.all = [];
    replaceMock.mockClear();
    searchParamsMock.get.mockReset();
    searchParamsMock.toString.mockReset();
    searchParamsMock.toString.mockReturnValue("");
    mockIsMemesWave = false;
    mockIsCurationWave = false;
    mockIsQuorumWave = false;
    mockIsApp = false;
    mockOnDropClick.mockClear();
    mockSetUnreadDividerSerialNo.mockClear();
    mockRemoveWaveDeliveredNotifications.mockClear();
    mockRemoveAllDeliveredNotifications.mockClear();
    invalidateNotificationsMock.mockClear();
    mockFetchAroundSerialNo.mockClear();
    mockSetToast.mockClear();
    mockUseWebSocketMessage.mockReset();
    mockUseWebSocketMessage.mockReturnValue({ isConnected: true });
    mockApprovalStatus.mockReset();
    mockApprovalStatus.mockReturnValue({
      winningThreshold: null,
      winningThresholdMinDurationMs: null,
      isVotingClosed: false,
      isVotingControlsLocked: false,
    });
    mockUseAuth.mockReturnValue({
      connectedProfile: { handle: "tester" },
      activeProfileProxy: null,
      setToast: mockSetToast,
    });
    (
      commonApiPostWithoutBodyAndResponse as jest.MockedFunction<
        typeof commonApiPostWithoutBodyAndResponse
      >
    ).mockClear();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(wrapWithProvider(component));
  };

  const wrapWithProvider = (component: React.ReactElement) => {
    return (
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications: invalidateNotificationsMock } as any}
      >
        <EditingDropProvider>{component}</EditingDropProvider>
      </ReactQueryWrapperContext.Provider>
    );
  };

  const getCreatorPropsByMode = (mode: string) => {
    const props = capturedCreatorPropsHolder.all.find(
      (creatorProps) => creatorProps.fixedDropMode === mode
    );
    expect(props).toBeDefined();
    return props as any;
  };

  const getDropDeleteCallback = () => {
    const dropDeleteSubscription = mockUseWebSocketMessage.mock.calls.find(
      ([messageType]) => messageType === WsMessageType.DROP_DELETE
    );
    expect(dropDeleteSubscription).toBeDefined();
    return dropDeleteSubscription?.[1] as (
      messageData: WsDropDeleteMessage["data"]
    ) => void;
  };

  it("handles serialNo param without rendering a memes chat shortcut", async () => {
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
    expect(screen.queryByRole("button", { name: /submit work/i })).toBeNull();
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
    expect(capturedCreatorPropsHolder.current.fixedDropMode).toBe("CHAT");
  });

  it("opens participation submit flow in a modal while keeping chat composer mounted", async () => {
    const onClose = jest.fn();
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    await act(async () => {
      renderWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
          chatSubmitDrop={{
            submissionExperience: WaveSubmissionExperience.DEFAULT,
            initialCurationUrl: null,
          }}
          onCloseChatSubmitDrop={onClose}
        />
      );
    });

    expect(screen.getByTestId("chat-submit-drop-modal")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Submit drop" })
    ).toBeInTheDocument();
    expect(
      capturedCreatorPropsHolder.all.map((props) => props.fixedDropMode)
    ).toEqual(expect.arrayContaining(["CHAT", "PARTICIPATION"]));
    expect(getCreatorPropsByMode("CHAT").termsSignatureFlowEnabled).toBe(false);
    expect(
      getCreatorPropsByMode("PARTICIPATION").termsSignatureFlowEnabled
    ).toBe(true);
  });

  it("closing the submit modal restores the normal chat composer", async () => {
    const onClose = jest.fn();
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    const { rerender } = renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
        chatSubmitDrop={{
          submissionExperience: WaveSubmissionExperience.DEFAULT,
          initialCurationUrl: null,
        }}
        onCloseChatSubmitDrop={onClose}
      />
    );

    expect(screen.getByTestId("chat-submit-drop-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Close modal"));
    expect(onClose).toHaveBeenCalledTimes(1);

    capturedCreatorPropsHolder.all = [];
    rerender(
      wrapWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
          chatSubmitDrop={null}
          onCloseChatSubmitDrop={onClose}
        />
      )
    );

    expect(
      screen.queryByTestId("chat-submit-drop-modal")
    ).not.toBeInTheDocument();
    expect(
      capturedCreatorPropsHolder.all.map((props) => props.fixedDropMode)
    ).toEqual(["CHAT"]);
    expect(capturedCreatorPropsHolder.current.termsSignatureFlowEnabled).toBe(
      true
    );
  });

  it("successful submit closes the submit modal", async () => {
    const onClose = jest.fn();
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
        chatSubmitDrop={{
          submissionExperience: WaveSubmissionExperience.DEFAULT,
          initialCurationUrl: null,
        }}
        onCloseChatSubmitDrop={onClose}
      />
    );

    fireEvent.click(screen.getByTestId("creator-success-PARTICIPATION"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens quorum proposal submit directly without the chat submit modal", async () => {
    const onClose = jest.fn();
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");
    mockIsQuorumWave = true;

    renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
        chatSubmitDrop={{
          submissionExperience: WaveSubmissionExperience.QUORUM_PROPOSAL,
          initialCurationUrl: null,
        }}
        onCloseChatSubmitDrop={onClose}
      />
    );

    expect(
      screen.queryByTestId("chat-submit-drop-modal")
    ).not.toBeInTheDocument();
    expect(
      capturedCreatorPropsHolder.all.map((props) => props.fixedDropMode)
    ).toEqual(expect.arrayContaining(["CHAT", "PARTICIPATION"]));
    expect(getCreatorPropsByMode("CHAT").termsSignatureFlowEnabled).toBe(false);
    expect(
      getCreatorPropsByMode("PARTICIPATION").termsSignatureFlowEnabled
    ).toBe(true);

    const quorumSubmitCreator = capturedCreatorPropsHolder.all.find(
      (props) => props.fixedDropMode === "PARTICIPATION"
    );

    expect(quorumSubmitCreator.onAllDropsAdded).toBe(onClose);
    expect(quorumSubmitCreator.onExitFixedDropMode).toBe(onClose);

    fireEvent.click(screen.getByTestId("creator-success-PARTICIPATION"));
    expect(onClose).toHaveBeenCalledTimes(1);

    quorumSubmitCreator.onExitFixedDropMode();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does not render the app submit CTA above the composer", async () => {
    const onOpen = jest.fn();
    mockIsApp = true;
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    await act(async () => {
      renderWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
          chatSubmitDropAction={{
            isVisible: true,
            canOpen: true,
            label: "Submit drop",
            compactLabel: "Drop",
            restrictionMessage: null,
            onOpen,
            onOpenWithCurationUrl: jest.fn(),
          }}
        />
      );
    });

    expect(
      screen.queryByRole("button", { name: "Submit drop" })
    ).not.toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
    expect(capturedCreatorPropsHolder.current.fixedDropMode).toBe("CHAT");
  });

  it("keeps composer mounted without app submit CTA when the modal is open", async () => {
    const onOpen = jest.fn();
    mockIsApp = true;
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    await act(async () => {
      renderWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
          chatSubmitDrop={{
            submissionExperience: WaveSubmissionExperience.DEFAULT,
            initialCurationUrl: null,
          }}
          chatSubmitDropAction={{
            isVisible: true,
            canOpen: true,
            label: "Submit drop",
            compactLabel: "Drop",
            restrictionMessage: null,
            onOpen,
            onOpenWithCurationUrl: jest.fn(),
          }}
          onCloseChatSubmitDrop={jest.fn()}
        />
      );
    });

    expect(
      screen.queryByRole("button", { name: "Submit drop" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("chat-submit-drop-modal")).toBeInTheDocument();
    expect(
      capturedCreatorPropsHolder.all.map((props) => props.fixedDropMode)
    ).toEqual(expect.arrayContaining(["CHAT", "PARTICIPATION"]));
    expect(getCreatorPropsByMode("CHAT").termsSignatureFlowEnabled).toBe(false);
    expect(
      getCreatorPropsByMode("PARTICIPATION").termsSignatureFlowEnabled
    ).toBe(true);
  });

  it("opens curation submit modal with a URL seed from chat composer", async () => {
    const onOpenWithCurationUrl = jest.fn();
    const onClose = jest.fn();
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    const { rerender } = renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
        chatSubmitDropAction={{
          isVisible: true,
          canOpen: true,
          label: "Submit drop",
          compactLabel: "Drop",
          restrictionMessage: null,
          onOpen: jest.fn(),
          onOpenWithCurationUrl,
        }}
        onCloseChatSubmitDrop={onClose}
      />
    );

    fireEvent.click(screen.getByTestId("submit-curation-url"));
    expect(onOpenWithCurationUrl).toHaveBeenCalledWith(PREFILL_URL);

    capturedCreatorPropsHolder.all = [];
    rerender(
      wrapWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
          chatSubmitDrop={{
            submissionExperience: WaveSubmissionExperience.CURATION_LEGACY,
            initialCurationUrl: PREFILL_URL,
          }}
          chatSubmitDropAction={{
            isVisible: true,
            canOpen: true,
            label: "Submit drop",
            compactLabel: "Drop",
            restrictionMessage: null,
            onOpen: jest.fn(),
            onOpenWithCurationUrl,
          }}
          onCloseChatSubmitDrop={onClose}
        />
      )
    );

    expect(screen.getByTestId("curation-drop-modal")).toBeInTheDocument();
    expect(capturedCreatorPropsHolder.current.initialCurationUrl).toBe(
      PREFILL_URL
    );
    expect(capturedCreatorPropsHolder.current.fixedDropMode).toBe(
      "PARTICIPATION"
    );
    expect(getCreatorPropsByMode("CHAT").termsSignatureFlowEnabled).toBe(false);
    expect(
      getCreatorPropsByMode("PARTICIPATION").termsSignatureFlowEnabled
    ).toBe(true);
  });

  it("shows the submit restriction instead of curation URL handoff when blocked", async () => {
    const onOpenWithCurationUrl = jest.fn();
    const restrictionMessage = "Submissions are locked.";
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    await act(async () => {
      renderWithProvider(
        <MyStreamWaveChat
          wave={wave}
          firstUnreadSerialNo={null}
          viewMode="chat"
          onDropClick={mockOnDropClick}
          chatSubmitDropAction={{
            isVisible: true,
            canOpen: false,
            label: "Submit drop",
            compactLabel: "Drop",
            restrictionMessage,
            onOpen: jest.fn(),
            onOpenWithCurationUrl,
          }}
        />
      );
    });

    expect(screen.queryByTestId("submit-curation-url")).not.toBeInTheDocument();
    expect(screen.getByTestId("curation-submit-restriction")).toHaveTextContent(
      restrictionMessage
    );
    expect(capturedCreatorPropsHolder.current.canSubmitCurationUrl).toBe(false);
    expect(
      capturedCreatorPropsHolder.current.curationUrlSubmitRestrictionMessage
    ).toBe(restrictionMessage);
    expect(onOpenWithCurationUrl).not.toHaveBeenCalled();
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
      winningThresholdMinDurationMs: 120_000,
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
    expect(capturedPropsHolder.current.winningThresholdMinDurationMs).toBe(
      120_000
    );
    expect(capturedPropsHolder.current.isVotingClosed).toBe(false);
    expect(capturedPropsHolder.current.isVotingControlsLocked).toBe(true);
    expect(capturedCreatorPropsHolder.current.fixedDropMode).toBe("CHAT");
  });

  it("clears an active reply when the reply target is deleted", async () => {
    const repliedDrop = { id: "deleted-drop" } as any;
    searchParamsMock.get.mockReturnValue(null);
    searchParamsMock.toString.mockReturnValue("");

    renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
      />
    );

    act(() => {
      capturedPropsHolder.current.onReply({ drop: repliedDrop, partId: 0 });
    });

    await waitFor(() => {
      expect(capturedCreatorPropsHolder.current.activeDrop?.drop.id).toBe(
        "deleted-drop"
      );
    });

    act(() => {
      getDropDeleteCallback()({
        wave_id: wave.id,
        drop_id: "deleted-drop",
      });
    });

    await waitFor(() => {
      expect(capturedCreatorPropsHolder.current.activeDrop).toBeNull();
    });
    expect(mockSetToast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "warning",
        toastId: REPLY_TARGET_UNAVAILABLE_TOAST_ID,
      })
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
    expect(mockFetchAroundSerialNo).not.toHaveBeenCalled();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ invalidateNotifications: invalidateNotificationsMock } as any}
      >
        <EditingDropProvider>
          <MyStreamWaveChat
            wave={wave}
            firstUnreadSerialNo={null}
            viewMode="chat"
            onDropClick={mockOnDropClick}
          />
        </EditingDropProvider>
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledTimes(1);
      expect(capturedPropsHolder.current.initialDrop).toBe(5);
      expect(mockFetchAroundSerialNo).toHaveBeenCalledWith("10", 5);
    });
  });

  it("hydrates the serial target when opening a wave from a route param", async () => {
    searchParamsMock.get.mockImplementation((key: string) =>
      key === "serialNo" ? "6679" : null
    );
    searchParamsMock.toString.mockReturnValue("serialNo=6679");

    renderWithProvider(
      <MyStreamWaveChat
        wave={wave}
        firstUnreadSerialNo={null}
        viewMode="chat"
        onDropClick={mockOnDropClick}
      />
    );

    await waitFor(() => {
      expect(mockFetchAroundSerialNo).toHaveBeenCalledWith("10", 6679);
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
