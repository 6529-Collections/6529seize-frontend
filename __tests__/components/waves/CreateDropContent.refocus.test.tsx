import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropContent from "@/components/waves/CreateDropContent";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";

const mockInputFocus = jest.fn();
const mockInputClear = jest.fn();
const mockRequestAuth = jest.fn(async () => ({ success: true }));
const mockSetToast = jest.fn();
const mockSetDrop = jest.fn();
const mockSetIsStormMode = jest.fn();
const mockOnDropModeChange = jest.fn();
const mockAddOptimisticDrop = jest.fn();

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
  useEditingDrop: jest.fn(() => ({
    editingDropId: null,
    setEditingDropId: jest.fn(),
  })),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isApp: false })),
}));

jest.mock("@/components/waves/CreateDropReplyingWrapper", () => () => (
  <div data-testid="reply-wrapper" />
));
jest.mock("@/components/waves/CreateDropActions", () => () => (
  <div data-testid="actions" />
));
jest.mock("@/components/waves/CreateDropInput", () => {
  const ReactLib = require("react");
  return {
    __esModule: true,
    default: ReactLib.forwardRef((props: any, ref: any) => {
      ReactLib.useImperativeHandle(ref, () => ({
        clearEditorState: mockInputClear,
        expandMentionAliases: async () => ({
          completed: true,
          editorState: undefined,
        }),
        focus: mockInputFocus,
      }));
      return (
        <div
          data-testid="input"
          data-mode={props.isDropMode ? "drop" : "chat"}
        />
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
    <button
      type="button"
      disabled={!props.canSubmit || props.submitting}
      title={props.disabledTooltip ?? undefined}
      onClick={() => void props.onDrop()}
    >
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
    connectedProfile: null,
  })),
}));

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    processIncomingDrop: jest.fn(),
  })),
}));

jest.mock("@/components/waves/hooks/useLatestEditableChatDropTarget", () => ({
  useLatestEditableChatDropTarget: jest.fn(() => null),
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
    type: ApiWaveType.Rank,
    authenticated_user_eligible_for_admin: false,
  },
  chat: {
    enabled: true,
  },
  participation: {
    required_metadata: [],
    required_media: [],
    signature_required: false,
    terms: null,
  },
} as any;

const createStoredDrop = () =>
  ({
    title: null,
    parts: [
      {
        content: "queued part",
        quoted_drop: null,
        media: [],
      },
    ],
    mentioned_users: [],
    mentioned_waves: [],
    referenced_nfts: [],
    metadata: [],
    signature: null,
  }) as any;

const renderSubject = ({
  isDropMode = false,
  isChatBlockedBySlowMode = false,
  drop = createStoredDrop(),
  waveOverride = wave,
  submitDrop = jest.fn(() => true),
}: {
  readonly isDropMode?: boolean;
  readonly isChatBlockedBySlowMode?: boolean;
  readonly drop?: any;
  readonly waveOverride?: any;
  readonly submitDrop?: jest.Mock;
} = {}) => {
  render(
    <ReactQueryWrapperContext.Provider
      value={{ addOptimisticDrop: mockAddOptimisticDrop } as any}
    >
      <CreateDropContent
        activeDrop={null}
        onCancelReplyQuote={jest.fn()}
        wave={waveOverride}
        drop={drop}
        isStormMode={false}
        isDropMode={isDropMode}
        dropId={null}
        setDrop={mockSetDrop}
        setIsStormMode={mockSetIsStormMode}
        onDropModeChange={mockOnDropModeChange}
        onSwitchToDropModeWithUrl={jest.fn()}
        submitDrop={submitDrop}
        dropModeToggleExitLabel={null}
        canExitDropMode={true}
        isChatBlockedBySlowMode={isChatBlockedBySlowMode}
        submissionExperience={WaveSubmissionExperience.DEFAULT}
      />
    </ReactQueryWrapperContext.Provider>
  );

  return { submitDrop };
};

describe("CreateDropContent chat refocus", () => {
  const originalRequestAnimationFrame = (
    globalThis as typeof globalThis & {
      requestAnimationFrame?: typeof requestAnimationFrame;
    }
  ).requestAnimationFrame;
  const originalCancelAnimationFrame = (
    globalThis as typeof globalThis & {
      cancelAnimationFrame?: typeof cancelAnimationFrame;
    }
  ).cancelAnimationFrame;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    }) as typeof globalThis.requestAnimationFrame;
    globalThis.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    if (originalRequestAnimationFrame) {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    } else {
      delete (globalThis as any).requestAnimationFrame;
    }

    if (originalCancelAnimationFrame) {
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    } else {
      delete (globalThis as any).cancelAnimationFrame;
    }
  });

  it("focuses the editor after an accepted chat submit resets it", async () => {
    const { submitDrop } = renderSubject({ isDropMode: false });

    await userEvent.click(screen.getByText("submit"));

    await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
    expect(submitDrop.mock.calls[0]?.[0].drop.drop_type).toBe(ApiDropType.Chat);
    await waitFor(() => expect(mockInputFocus).toHaveBeenCalledTimes(1));
    expect(mockInputClear).toHaveBeenCalled();
    const clearOrder = mockInputClear.mock.invocationCallOrder[0];
    const focusOrder = mockInputFocus.mock.invocationCallOrder[0];
    if (clearOrder === undefined || focusOrder === undefined) {
      throw new Error("Expected clear and focus to be called");
    }
    expect(clearOrder).toBeLessThan(focusOrder);
  });

  it("does not submit, reset, or focus while slow-mode chat is blocked", async () => {
    const { submitDrop } = renderSubject({
      isDropMode: false,
      isChatBlockedBySlowMode: true,
    });

    await userEvent.click(screen.getByText("submit"));

    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(submitDrop).not.toHaveBeenCalled();
    expect(mockInputClear).not.toHaveBeenCalled();
    expect(mockInputFocus).not.toHaveBeenCalled();
  });

  it("disables chat submit with tooltip while link restriction is active", async () => {
    const submitDrop = jest.fn(() => true);
    renderSubject({
      isDropMode: false,
      submitDrop,
      waveOverride: {
        ...wave,
        chat: {
          ...wave.chat,
          links_disabled: true,
        },
      },
      drop: {
        ...createStoredDrop(),
        parts: [
          {
            content: "https://example.com/article",
            quoted_drop: null,
            media: [],
          },
        ],
      },
    });

    const submitButton = screen.getByText("submit");

    expect(
      screen.getByText("Links are not allowed in this wave")
    ).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute(
      "title",
      "Links are not allowed in this wave"
    );

    await userEvent.click(submitButton);

    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(submitDrop).not.toHaveBeenCalled();
  });

  it("disables chat submit for non-allowed direct media links", async () => {
    const submitDrop = jest.fn(() => true);
    renderSubject({
      isDropMode: false,
      submitDrop,
      waveOverride: {
        ...wave,
        chat: {
          ...wave.chat,
          links_disabled: true,
        },
      },
      drop: {
        ...createStoredDrop(),
        parts: [
          {
            content: "https://example.com/image.jpg",
            quoted_drop: null,
            media: [],
          },
        ],
      },
    });

    const submitButton = screen.getByText("submit");

    expect(
      screen.getByText("Links are not allowed in this wave")
    ).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await userEvent.click(submitButton);

    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(submitDrop).not.toHaveBeenCalled();
  });

  it("does not disable chat submit for allowed CloudFront links", async () => {
    const submitDrop = jest.fn(() => true);
    renderSubject({
      isDropMode: false,
      submitDrop,
      waveOverride: {
        ...wave,
        chat: {
          ...wave.chat,
          links_disabled: true,
        },
      },
      drop: {
        ...createStoredDrop(),
        parts: [
          {
            content: "https://d3lqz0a4bldqgf.cloudfront.net/drops/asset.mp4",
            quoted_drop: null,
            media: [],
          },
        ],
      },
    });

    const submitButton = screen.getByText("submit");

    expect(
      screen.queryByText("Links are not allowed in this wave")
    ).not.toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();

    await userEvent.click(submitButton);

    await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
    expect(submitDrop.mock.calls[0]?.[0].drop.drop_type).toBe(ApiDropType.Chat);
  });

  it("does not disable chat submit for allowed Tenor links", async () => {
    const submitDrop = jest.fn(() => true);
    renderSubject({
      isDropMode: false,
      submitDrop,
      waveOverride: {
        ...wave,
        chat: {
          ...wave.chat,
          links_disabled: true,
        },
      },
      drop: {
        ...createStoredDrop(),
        parts: [
          {
            content: "https://media.tenor.com/abc/tenor.mp4",
            quoted_drop: null,
            media: [],
          },
        ],
      },
    });

    const submitButton = screen.getByText("submit");

    expect(
      screen.queryByText("Links are not allowed in this wave")
    ).not.toBeInTheDocument();
    expect(submitButton).not.toBeDisabled();

    await userEvent.click(submitButton);

    await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
    expect(submitDrop.mock.calls[0]?.[0].drop.drop_type).toBe(ApiDropType.Chat);
  });

  it("does not block participatory submit with a link", async () => {
    const submitDrop = jest.fn(() => true);
    renderSubject({
      isDropMode: true,
      submitDrop,
      waveOverride: {
        ...wave,
        chat: {
          ...wave.chat,
          links_disabled: true,
        },
      },
      drop: {
        ...createStoredDrop(),
        parts: [
          {
            content: "https://example.com/article",
            quoted_drop: null,
            media: [],
          },
        ],
      },
    });

    await userEvent.click(screen.getByText("submit"));

    expect(
      screen.queryByText("Links are not allowed in this wave")
    ).not.toBeInTheDocument();
    await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
    expect(submitDrop.mock.calls[0]?.[0].drop.drop_type).toBe(
      ApiDropType.Participatory
    );
  });

  it("does not refocus after an accepted participatory submit", async () => {
    const { submitDrop } = renderSubject({ isDropMode: true });

    await userEvent.click(screen.getByText("submit"));

    await waitFor(() => expect(submitDrop).toHaveBeenCalledTimes(1));
    expect(submitDrop.mock.calls[0]?.[0].drop.drop_type).toBe(
      ApiDropType.Participatory
    );
    await waitFor(() => expect(mockInputClear).toHaveBeenCalled());
    expect(mockInputFocus).not.toHaveBeenCalled();
  });
});
