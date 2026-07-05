import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropContent from "@/components/waves/CreateDropContent";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { exportDropMarkdown } from "@/components/waves/drops/normalizeDropMarkdown";

const mockViewerSelection = {
  value: "0xviewer",
  label: "viewer",
  secondaryLabel: "0xviewer",
  avatarUrl: null,
  profileId: "viewer-id",
};

const mockOtherSelection = {
  value: "0xother",
  label: "other",
  secondaryLabel: "0xother",
  avatarUrl: null,
  profileId: "other-id",
};
const mockSetToast = jest.fn();
const mockRequestAuth = jest.fn(async () => ({ success: true }));
const mockUploadFile = new File(["upload"], "duplicate.pdf", {
  type: "application/pdf",
});
let resizeObserverCallback: ResizeObserverCallback | null = null;

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
    motion: {
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
jest.mock("@/components/waves/CreateDropActions", () => (props: any) => (
  <div
    data-testid="actions"
    data-show-options={props.showOptions ? "true" : "false"}
    data-animate-options={props.animateOptions ? "true" : "false"}
  >
    <button type="button" onClick={() => props.setShowOptions(true)}>
      open options
    </button>
    <button type="button" onClick={props.onAddMetadataClick}>
      open metadata
    </button>
    <button
      type="button"
      onClick={() => props.handleFileChange([mockUploadFile])}
    >
      add upload file
    </button>
    <button
      type="button"
      onClick={() => {
        void props.onGifDrop("https://example.com/test.gif");
      }}
    >
      select gif
    </button>
  </div>
));
jest.mock("@/components/waves/CreateDropInput", () => {
  const ReactLib = require("react");

  return {
    __esModule: true,
    default: ReactLib.forwardRef((props: any, ref: any) => {
      const typedContentCountRef = ReactLib.useRef(0);
      ReactLib.useImperativeHandle(ref, () => ({
        clearEditorState: () => undefined,
        focus: () => undefined,
      }));

      return (
        <div data-testid="input">
          <button
            type="button"
            onClick={() => {
              typedContentCountRef.current += 1;
              props.onEditorState({
                __markdown: `typed content ${typedContentCountRef.current}`,
              });
            }}
          >
            type content
          </button>
          <button
            type="button"
            onClick={() =>
              props.onEditorState({
                __markdown: "pending ![Seize](loading)",
              })
            }
          >
            type pending image
          </button>
          <button
            type="button"
            onClick={() => props.onEditorState({ __markdown: "" })}
          >
            emit empty content
          </button>
        </div>
      );
    }),
  };
});
jest.mock("@/components/waves/drops/normalizeDropMarkdown", () => ({
  exportDropMarkdown: jest.fn(
    (editorState: { __markdown?: string } | null) =>
      editorState?.__markdown ?? ""
  ),
}));
const mockExportDropMarkdown = exportDropMarkdown as jest.MockedFunction<
  typeof exportDropMarkdown
>;
jest.mock(
  "@/components/drops/create/lexical/utils/groupMentionDetection",
  () => ({
    getMentionedGroupsFromEditorState: jest.fn(() => []),
  })
);
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
jest.mock("@/components/waves/CreateDropIdentityField", () => (props: any) => (
  <div data-testid="identity-field">
    <span>
      {props.selectedIdentity?.label ??
        (props.mode === "ONLY_MYSELF" ? props.selfIdentity?.label : null) ??
        "none"}
    </span>
    <button type="button" onClick={props.onOpenPicker}>
      change identity
    </button>
  </div>
));

jest.mock("@/components/waves/utils/getOptimisticDrop", () => ({
  getOptimisticDrop: jest.fn(() => null),
}));

jest.mock(
  "@/components/waves/CreateDropIdentityPickerContent",
  () => (props: any) => (
    <div data-testid="identity-picker-content">
      <div>{props.errorMessage}</div>
      <button type="button" onClick={() => props.onSelect(mockOtherSelection)}>
        select other
      </button>
      <button type="button" onClick={() => props.onSelect(mockViewerSelection)}>
        select self
      </button>
    </div>
  )
);

jest.mock(
  "@/components/waves/CreateDropIdentityPickerModal",
  () => (props: any) =>
    props.isOpen ? (
      <div data-testid="identity-picker-modal">
        <div>{props.errorMessage}</div>
        <button
          type="button"
          onClick={() => props.onSelect(mockOtherSelection)}
        >
          select other
        </button>
        <button
          type="button"
          onClick={() => props.onSelect(mockViewerSelection)}
        >
          select self
        </button>
        <button type="button" onClick={props.onClose}>
          close picker
        </button>
      </div>
    ) : null
);

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
      id: mockViewerSelection.profileId,
      handle: mockViewerSelection.label,
      display: mockViewerSelection.label,
      primary_wallet: mockViewerSelection.value,
      pfp: null,
    },
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

describe("CreateDropContent identity picker flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetToast.mockClear();
    mockRequestAuth.mockClear();
    resizeObserverCallback = null;
    (global as any).ResizeObserver = jest
      .fn()
      .mockImplementation((callback: ResizeObserverCallback) => {
        resizeObserverCallback = callback;
        return {
          observe: jest.fn(),
          unobserve: jest.fn(),
          disconnect: jest.fn(),
        };
      });
  });

  it("skips duplicate file uploads", async () => {
    renderSubject();

    await userEvent.click(screen.getByText("add upload file"));
    await userEvent.click(screen.getByText("add upload file"));

    expect(mockSetToast).toHaveBeenCalledWith({
      message: "1 duplicate file was skipped.",
      type: "warning",
    });
  });

  it("does not submit while an inline image upload is unresolved", async () => {
    const submitDrop = jest.fn(() => true);
    renderSubject({ isDropMode: false, submitDrop });

    await userEvent.click(screen.getByText("type pending image"));
    await userEvent.click(screen.getByText("submit"));

    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(submitDrop).not.toHaveBeenCalled();
  });

  it("does not submit a GIF while an inline image upload is unresolved", async () => {
    const submitDrop = jest.fn(() => true);
    renderSubject({ isDropMode: false, submitDrop });

    await userEvent.click(screen.getByText("type pending image"));
    await userEvent.click(screen.getByText("select gif"));

    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(submitDrop).not.toHaveBeenCalled();
  });

  const baseWave = {
    id: "wave-1",
    author: { handle: "creator" },
    wave: { type: ApiWaveType.Rank },
    chat: { enabled: true, links_disabled: false },
    participation: {
      submission_strategy: {
        config: {
          who_can_be_submitted:
            ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
        },
      },
      required_metadata: [],
      required_media: [],
    },
  } as any;

  const createWave = ({
    id = baseWave.id,
    mode = ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyOthers,
  }: {
    readonly id?: string;
    readonly mode?: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted;
  } = {}) =>
    ({
      ...baseWave,
      id,
      participation: {
        ...baseWave.participation,
        submission_strategy: {
          ...baseWave.participation.submission_strategy,
          config: {
            ...baseWave.participation.submission_strategy.config,
            who_can_be_submitted: mode,
          },
        },
      },
    }) as any;

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

  const mockComposerWidth = (width: number) =>
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width,
      height: 0,
      top: 0,
      right: width,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect);

  const emitComposerResize = (width: number) => {
    if (!resizeObserverCallback) {
      throw new Error("ResizeObserver callback was not registered.");
    }

    act(() => {
      resizeObserverCallback?.(
        [
          {
            contentRect: { width } as DOMRectReadOnly,
          } as ResizeObserverEntry,
        ],
        {} as ResizeObserver
      );
    });
  };

  const renderSubject = ({
    isDropMode = true,
    wave = createWave(),
    drop = null,
    submitDrop = jest.fn(() => true),
    isChatBlockedBySlowMode = false,
    identityPickerPlacement = "modal",
  }: {
    readonly isDropMode?: boolean;
    readonly wave?: any;
    readonly drop?: any;
    readonly submitDrop?: jest.Mock;
    readonly isChatBlockedBySlowMode?: boolean;
    readonly identityPickerPlacement?: "modal" | "inline";
  } = {}) => {
    const onDropModeChange = jest.fn();
    const utils = render(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={wave}
          drop={drop}
          isStormMode={false}
          isDropMode={isDropMode}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={onDropModeChange}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={submitDrop}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={isChatBlockedBySlowMode}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
          identityPickerPlacement={identityPickerPlacement}
        />
      </ReactQueryWrapperContext.Provider>
    );

    return {
      ...utils,
      onDropModeChange,
      submitDrop,
    };
  };

  it("does not submit a GIF chat drop while slow mode is active", async () => {
    const { submitDrop } = renderSubject({
      isDropMode: false,
      isChatBlockedBySlowMode: true,
    });

    await userEvent.click(screen.getByText("select gif"));

    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(submitDrop).not.toHaveBeenCalled();
  });

  it("auto-opens the picker and exits Drop mode when closed without a selection", async () => {
    const { onDropModeChange } = renderSubject();

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();

    await userEvent.click(screen.getByText("close picker"));

    expect(onDropModeChange).toHaveBeenCalledWith(false);
  });

  it("stores the selected identity, closes the picker, and reopens on change", async () => {
    renderSubject();

    await userEvent.click(screen.getByText("select other"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("identity-picker-modal")
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("identity-field")).toHaveTextContent("other");

    await userEvent.click(screen.getByText("change identity"));

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
  });

  it("clears the selected identity after submit without auto-reopening the picker", async () => {
    const { submitDrop } = renderSubject({ drop: createStoredDrop() });

    await userEvent.click(screen.getByText("select other"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("identity-picker-modal")
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("identity-field")).toHaveTextContent("other");

    await userEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(submitDrop).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId("identity-field")).toHaveTextContent("none");
      expect(
        screen.queryByTestId("identity-picker-modal")
      ).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("change identity"));

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
  });

  it("does not suppress picker auto-open after a chat submit on an identity wave", async () => {
    const chatSubmit = jest.fn();
    const { rerender } = renderSubject({
      isDropMode: false,
      drop: createStoredDrop(),
      submitDrop: chatSubmit,
    });

    expect(
      screen.queryByTestId("identity-picker-modal")
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("submit"));

    await waitFor(() => {
      expect(chatSubmit).toHaveBeenCalledTimes(1);
    });

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave()}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
  });

  it("keeps the picker open and shows an error when selecting the viewer identity in OnlyOthers mode", async () => {
    renderSubject();

    await userEvent.click(screen.getByText("select self"));

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
    expect(
      screen.getByText("Select someone else to nominate.")
    ).toBeInTheDocument();
  });

  it("renders the inline picker instead of the modal when placement is inline", () => {
    renderSubject({ identityPickerPlacement: "inline" });

    expect(screen.getByTestId("identity-picker-inline")).toBeInTheDocument();
    expect(
      screen.queryByTestId("identity-picker-modal")
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("input")).not.toBeInTheDocument();
  });

  it("exits Drop mode when the inline picker closes without a selection", async () => {
    const { onDropModeChange } = renderSubject({
      identityPickerPlacement: "inline",
    });

    await userEvent.click(screen.getByLabelText("Close identity picker"));

    expect(onDropModeChange).toHaveBeenCalledWith(false);
  });

  it("hides the inline picker and shows the composer after selecting an identity", async () => {
    renderSubject({ identityPickerPlacement: "inline" });

    await userEvent.click(screen.getByText("select other"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("identity-picker-inline")
      ).not.toBeInTheDocument();
    });
    expect(screen.getByTestId("identity-field")).toHaveTextContent("other");
    expect(screen.getByTestId("input")).toBeInTheDocument();
  });

  it("measures the action width after the inline picker closes", async () => {
    const rectSpy = mockComposerWidth(501);

    try {
      renderSubject({ identityPickerPlacement: "inline" });

      expect(screen.queryByTestId("input")).not.toBeInTheDocument();

      await userEvent.click(screen.getByText("select other"));

      await waitFor(() => {
        expect(screen.getByTestId("input")).toBeInTheDocument();
      });
      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );
      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-animate-options",
        "false"
      );
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("shows options by default in a wide composer", () => {
    const rectSpy = mockComposerWidth(501);

    try {
      renderSubject();

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );
      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-animate-options",
        "false"
      );
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("collapses wide composer options when content is typed", async () => {
    const rectSpy = mockComposerWidth(501);

    try {
      renderSubject();

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );
      expect(mockExportDropMarkdown).not.toHaveBeenCalled();

      await userEvent.click(screen.getByText("type content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-animate-options",
          "true"
        );
      });
      expect(mockExportDropMarkdown).toHaveBeenCalledTimes(1);
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("reopens wide composer options and collapses them on the next content change", async () => {
    const rectSpy = mockComposerWidth(501);

    try {
      renderSubject();

      await userEvent.click(screen.getByText("type content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
      });

      await userEvent.click(screen.getByText("open options"));

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );
      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-animate-options",
        "true"
      );

      await userEvent.click(screen.getByText("type content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
      });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("keeps reopened wide options open after resizing narrow on empty editor changes", async () => {
    const rectSpy = mockComposerWidth(501);

    try {
      renderSubject();

      await userEvent.click(screen.getByText("type content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
      });

      await userEvent.click(screen.getByText("open options"));

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );

      emitComposerResize(499);

      await userEvent.click(screen.getByText("emit empty content"));

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("collapses reopened wide options after resizing narrow on content changes", async () => {
    const rectSpy = mockComposerWidth(501);

    try {
      renderSubject();

      await userEvent.click(screen.getByText("type content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
      });

      await userEvent.click(screen.getByText("open options"));

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );

      emitComposerResize(499);

      await userEvent.click(screen.getByText("type content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
      });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("collapses narrow composer options on empty editor changes after opening options", async () => {
    const rectSpy = mockComposerWidth(499);

    try {
      renderSubject();

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "false"
      );

      await userEvent.click(screen.getByText("open options"));

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );

      await userEvent.click(screen.getByText("emit empty content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
      });
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("returns to wide composer defaults when the wave changes", async () => {
    const rectSpy = mockComposerWidth(501);

    try {
      const { rerender } = renderSubject();

      await userEvent.click(screen.getByText("type content"));

      await waitFor(() => {
        expect(screen.getByTestId("actions")).toHaveAttribute(
          "data-show-options",
          "false"
        );
      });

      rerender(
        <ReactQueryWrapperContext.Provider
          value={{ addOptimisticDrop: jest.fn() } as any}
        >
          <CreateDropContent
            activeDrop={null}
            onCancelReplyQuote={jest.fn()}
            wave={createWave({ id: "wave-2" })}
            drop={null}
            isStormMode={false}
            isDropMode={true}
            dropId={null}
            setDrop={jest.fn()}
            setIsStormMode={jest.fn()}
            onDropModeChange={jest.fn()}
            onSwitchToDropModeWithUrl={jest.fn()}
            submitDrop={jest.fn()}
            dropModeToggleExitLabel={null}
            canExitDropMode={true}
            isChatBlockedBySlowMode={false}
            submissionExperience={WaveSubmissionExperience.IDENTITY}
          />
        </ReactQueryWrapperContext.Provider>
      );

      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-show-options",
        "true"
      );
      expect(screen.getByTestId("actions")).toHaveAttribute(
        "data-animate-options",
        "false"
      );
    } finally {
      rectSpy.mockRestore();
    }
  });

  it("reopens the inline picker when changing identity", async () => {
    renderSubject({ identityPickerPlacement: "inline" });

    await userEvent.click(screen.getByText("select other"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("identity-picker-inline")
      ).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("change identity"));

    expect(screen.getByTestId("identity-picker-inline")).toBeInTheDocument();
    expect(screen.queryByTestId("input")).not.toBeInTheDocument();
  });

  it("keeps the inline picker open and shows an error when selecting self in OnlyOthers mode", async () => {
    renderSubject({ identityPickerPlacement: "inline" });

    await userEvent.click(screen.getByText("select self"));

    expect(screen.getByTestId("identity-picker-inline")).toBeInTheDocument();
    expect(
      screen.getByText("Select someone else to nominate.")
    ).toBeInTheDocument();
  });

  it("clears the selected identity after leaving Drop mode and reopens the picker on re-entry", async () => {
    const { rerender } = renderSubject();

    await userEvent.click(screen.getByText("select other"));
    expect(screen.getByTestId("identity-field")).toHaveTextContent("other");

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave()}
          drop={null}
          isStormMode={false}
          isDropMode={false}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave()}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("identity-field")).toHaveTextContent("none");
    });
    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
  });

  it("closes metadata after leaving Drop mode and keeps it closed on re-entry", async () => {
    const { rerender } = renderSubject();

    expect(screen.queryByTestId("metadata")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("open metadata"));

    expect(screen.getByTestId("metadata")).toBeInTheDocument();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave()}
          drop={null}
          isStormMode={false}
          isDropMode={false}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.queryByTestId("metadata")).not.toBeInTheDocument();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave()}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.queryByTestId("metadata")).not.toBeInTheDocument();
  });

  it("does not leak open metadata into a new wave while staying in Drop mode", async () => {
    const { rerender } = renderSubject();

    expect(screen.queryByTestId("metadata")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("open metadata"));

    expect(screen.getByTestId("metadata")).toBeInTheDocument();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave({ id: "wave-2" })}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.queryByTestId("metadata")).not.toBeInTheDocument();
  });

  it("clears stale identity-picker errors after leaving Drop mode and re-entering", async () => {
    const { rerender } = renderSubject();

    await userEvent.click(screen.getByText("select self"));

    expect(
      screen.getByText("Select someone else to nominate.")
    ).toBeInTheDocument();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave()}
          drop={null}
          isStormMode={false}
          isDropMode={false}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(
      screen.queryByText("Select someone else to nominate.")
    ).not.toBeInTheDocument();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave()}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
    expect(
      screen.queryByText("Select someone else to nominate.")
    ).not.toBeInTheDocument();
  });

  it("does not leak an explicit picker-open state into a new wave", async () => {
    const { rerender } = renderSubject();

    await userEvent.click(screen.getByText("select other"));
    await userEvent.click(screen.getByText("change identity"));

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave({
            id: "wave-2",
            mode: ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted.OnlyMyself,
          })}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(
      screen.queryByTestId("identity-picker-modal")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("identity-field")).toHaveTextContent("viewer");
  });

  it("clears stale identity-picker errors when the wave changes", async () => {
    const { rerender } = renderSubject();

    await userEvent.click(screen.getByText("select self"));

    expect(
      screen.getByText("Select someone else to nominate.")
    ).toBeInTheDocument();

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave({ id: "wave-2" })}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
    expect(
      screen.queryByText("Select someone else to nominate.")
    ).not.toBeInTheDocument();
  });

  it("does not leak mobile options state into a new wave", async () => {
    const { rerender } = renderSubject();

    await userEvent.click(screen.getByText("open options"));

    expect(screen.getByTestId("actions")).toHaveAttribute(
      "data-show-options",
      "true"
    );

    rerender(
      <ReactQueryWrapperContext.Provider
        value={{ addOptimisticDrop: jest.fn() } as any}
      >
        <CreateDropContent
          activeDrop={null}
          onCancelReplyQuote={jest.fn()}
          wave={createWave({ id: "wave-2" })}
          drop={null}
          isStormMode={false}
          isDropMode={true}
          dropId={null}
          setDrop={jest.fn()}
          setIsStormMode={jest.fn()}
          onDropModeChange={jest.fn()}
          onSwitchToDropModeWithUrl={jest.fn()}
          submitDrop={jest.fn()}
          dropModeToggleExitLabel={null}
          canExitDropMode={true}
          isChatBlockedBySlowMode={false}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByTestId("actions")).toHaveAttribute(
      "data-show-options",
      "false"
    );
  });
});
