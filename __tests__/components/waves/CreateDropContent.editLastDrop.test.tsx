import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropContent from "@/components/waves/CreateDropContent";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { ActiveDropAction } from "@/types/dropInteractionTypes";

const mockSetEditingDropId = jest.fn();
const mockRequestScrollToSerialNo = jest.fn();
const mockRequestAuth = jest.fn(async () => ({ success: true }));
const mockSetToast = jest.fn();
let mockEditingDropId: string | null = null;
let mockComposerMarkdown: string | null = null;
let mockLatestEditableChatDropTarget: {
  readonly id: string;
  readonly serialNo: number;
} | null = null;

jest.mock("next/dynamic", () => () => () => null);

jest.mock("framer-motion", () => {
  const ReactLib = require("react");
  const MotionDiv = ReactLib.forwardRef(function Div(
    {
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      readonly children: React.ReactNode;
      readonly initial?: unknown;
      readonly animate?: unknown;
      readonly exit?: unknown;
      readonly transition?: unknown;
    },
    ref: React.Ref<HTMLDivElement>
  ) {
    const htmlProps = { ...props } as Record<string, unknown>;
    delete htmlProps.initial;
    delete htmlProps.animate;
    delete htmlProps.exit;
    delete htmlProps.transition;

    return ReactLib.createElement("div", { ...htmlProps, ref }, children);
  });

  return {
    __esModule: true,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    LazyMotion: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    domAnimation: {},
    m: {
      div: MotionDiv,
    },
  };
});

jest.mock("@/contexts/EditingDropContext", () => ({
  useEditingDrop: () => ({
    editingDropId: mockEditingDropId,
    setEditingDropId: mockSetEditingDropId,
  }),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock("@/components/waves/drops/normalizeDropMarkdown", () => ({
  exportDropMarkdown: jest.fn(() => mockComposerMarkdown),
}));

jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  useWaveChatScrollOptional: () => ({
    requestScrollToSerialNo: mockRequestScrollToSerialNo,
  }),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    processIncomingDrop: jest.fn(),
  })),
}));

jest.mock("@/components/waves/hooks/useLatestEditableChatDropTarget", () => ({
  useLatestEditableChatDropTarget: jest.fn(
    () => mockLatestEditableChatDropTarget
  ),
}));

jest.mock("@/components/waves/CreateDropReplyingWrapper", () => () => (
  <div data-testid="reply-wrapper" />
));
jest.mock("@/components/waves/CreateDropActions", () => (props: any) => (
  <div data-testid="actions">
    <button
      type="button"
      onClick={() =>
        props.handleFileChange([
          new File(["image"], "image.png", { type: "image/png" }),
        ])
      }
    >
      add file
    </button>
  </div>
));
jest.mock("@/components/waves/CreateDropInput", () => {
  const ReactLib = require("react");
  return {
    __esModule: true,
    default: ReactLib.forwardRef((props: any, ref: any) => {
      const hasSentEditorStateRef = ReactLib.useRef(false);
      ReactLib.useImperativeHandle(ref, () => ({
        clearEditorState: jest.fn(),
        focus: jest.fn(),
      }));

      ReactLib.useEffect(() => {
        if (mockComposerMarkdown !== null && !hasSentEditorStateRef.current) {
          hasSentEditorStateRef.current = true;
          props.onEditorState({ read: jest.fn() });
        }
      }, [props.onEditorState]);

      return (
        <button
          type="button"
          data-testid="request-edit-last-drop"
          data-can-edit-last-drop={String(props.canEditLastDropWithArrow)}
          onClick={() => props.onRequestEditLastDrop?.()}
        >
          request edit
        </button>
      );
    }),
  };
});
jest.mock("@/components/waves/CreateDropContentRequirements", () => () => (
  <div data-testid="requirements" />
));
jest.mock("@/components/waves/CreateDropMetadata", () => () => (
  <div data-testid="metadata" />
));
jest.mock("@/components/waves/CreateDropContentFiles", () => ({
  CreateDropContentFiles: () => <div data-testid="files" />,
}));
jest.mock("@/components/waves/SlowModeChatNotice", () => () => (
  <div data-testid="slow-mode-notice" />
));
jest.mock("@/components/waves/CreateDropSubmit", () => ({
  CreateDropSubmit: (props: any) => (
    <button type="button" onClick={() => void props.onDrop()}>
      submit
    </button>
  ),
}));
jest.mock("@/components/waves/CreateDropIdentityField", () => () => (
  <div data-testid="identity-field" />
));
jest.mock("@/components/waves/CreateDropIdentityPickerContent", () => () => (
  <div data-testid="identity-picker-content" />
));
jest.mock("@/components/waves/CreateDropIdentityPickerModal", () => () => null);

jest.mock("@/components/waves/utils/getOptimisticDrop", () => ({
  getOptimisticDrop: jest.fn(() => null),
}));

jest.mock("@/components/waves/hooks/useDropMetadata", () => ({
  generateMetadataId: jest.fn(() => "metadata-id"),
  useDropMetadata: jest.fn(() => ({
    metadata: [],
    setMetadata: jest.fn(),
    initialMetadata: [],
  })),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(() => ({
    requestAuth: mockRequestAuth,
    setToast: mockSetToast,
    connectedProfile: {
      id: "profile-1",
      handle: "alice",
      display: "alice",
      primary_wallet: "0xalice",
      pfp: null,
    },
    activeProfileProxy: null,
  })),
}));

jest.mock("@/hooks/drops/useDropSignature", () => ({
  useDropSignature: jest.fn(() => ({
    signDrop: jest.fn(),
  })),
}));

jest.mock("@/services/websocket", () => ({
  useWebSocket: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(() => ({
    isSafeWallet: false,
    address: null,
  })),
}));

const wave = {
  id: "wave-1",
  author: { handle: "creator" },
  wave: {
    type: ApiWaveType.Chat,
    authenticated_user_eligible_for_admin: false,
  },
  chat: {
    enabled: true,
    links_disabled: false,
  },
  participation: {
    required_metadata: [],
    required_media: [],
    signature_required: false,
    terms: null,
    submission_strategy: null,
  },
} as any;

const renderSubject = (
  props: Partial<React.ComponentProps<typeof CreateDropContent>> = {}
) =>
  render(
    <ReactQueryWrapperContext.Provider
      value={{ addOptimisticDrop: jest.fn() } as any}
    >
      <CreateDropContent
        activeDrop={null}
        onCancelReplyQuote={jest.fn()}
        wave={wave}
        drop={null}
        isStormMode={false}
        isDropMode={false}
        dropId={null}
        setDrop={jest.fn()}
        setIsStormMode={jest.fn()}
        onDropModeChange={jest.fn()}
        onSwitchToDropModeWithUrl={jest.fn()}
        submitDrop={jest.fn(() => true)}
        dropModeToggleExitLabel={null}
        canExitDropMode={true}
        isChatBlockedBySlowMode={false}
        submissionExperience={WaveSubmissionExperience.DEFAULT}
        termsSignatureFlowEnabled={false}
        {...props}
      />
    </ReactQueryWrapperContext.Provider>
  );

describe("CreateDropContent edit last drop shortcut", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEditingDropId = null;
    mockComposerMarkdown = null;
    mockLatestEditableChatDropTarget = { id: "drop-latest", serialNo: 42 };
    (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  });

  it("opens the latest own inline editor from an empty base chat composer", async () => {
    renderSubject();

    await userEvent.click(screen.getByTestId("request-edit-last-drop"));

    expect(mockSetEditingDropId).toHaveBeenCalledWith("drop-latest");
    expect(mockRequestScrollToSerialNo).toHaveBeenCalledWith({
      waveId: "wave-1",
      serialNo: 42,
    });
  });

  it("does not open edit from a non-empty composer", async () => {
    mockComposerMarkdown = "draft";
    renderSubject();

    await waitFor(() =>
      expect(screen.getByTestId("request-edit-last-drop")).toHaveAttribute(
        "data-can-edit-last-drop",
        "false"
      )
    );
    await userEvent.click(screen.getByTestId("request-edit-last-drop"));

    expect(mockSetEditingDropId).not.toHaveBeenCalled();
  });

  it.each([ActiveDropAction.REPLY, ActiveDropAction.QUOTE])(
    "does not open edit in %s mode",
    async (action) => {
      renderSubject({
        activeDrop: {
          action,
          drop: { id: "active-drop" },
          partId: 0,
        } as any,
      });

      await userEvent.click(screen.getByTestId("request-edit-last-drop"));

      expect(mockSetEditingDropId).not.toHaveBeenCalled();
    }
  );

  it("does not open edit with files or draft storm parts", async () => {
    const { unmount } = renderSubject();

    await userEvent.click(screen.getByText("add file"));
    await waitFor(() =>
      expect(screen.getByTestId("request-edit-last-drop")).toHaveAttribute(
        "data-can-edit-last-drop",
        "false"
      )
    );
    await userEvent.click(screen.getByTestId("request-edit-last-drop"));
    expect(mockSetEditingDropId).not.toHaveBeenCalled();

    unmount();
    mockSetEditingDropId.mockClear();
    renderSubject({
      drop: {
        title: null,
        drop_type: ApiDropType.Chat,
        parts: [
          {
            content: "draft part",
            quoted_drop: null,
            media: [],
            mentioned_groups: [],
          },
        ],
        mentioned_users: [],
        mentioned_groups: [],
        mentioned_waves: [],
        referenced_nfts: [],
        metadata: [],
        signature: null,
        is_safe_signature: false,
        signer_address: "",
      },
      isStormMode: true,
    } as Partial<React.ComponentProps<typeof CreateDropContent>>);

    await userEvent.click(screen.getByTestId("request-edit-last-drop"));

    expect(mockSetEditingDropId).not.toHaveBeenCalled();
  });

  it("does not open edit in drop mode", async () => {
    renderSubject({ isDropMode: true });

    await userEvent.click(screen.getByTestId("request-edit-last-drop"));

    expect(mockSetEditingDropId).not.toHaveBeenCalled();
  });

  it("does not open edit without an editable target", async () => {
    mockLatestEditableChatDropTarget = null;
    renderSubject();

    await userEvent.click(screen.getByTestId("request-edit-last-drop"));

    expect(mockSetEditingDropId).not.toHaveBeenCalled();
  });
});
