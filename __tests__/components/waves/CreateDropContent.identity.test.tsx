import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateDropContent from "@/components/waves/CreateDropContent";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import { ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted } from "@/generated/models/ApiWaveParticipationIdentitySubmissionWhoCanBeSubmitted";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

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
const mockUploadFile = new File(["upload"], "duplicate.pdf", {
  type: "application/pdf",
});

jest.mock("next/dynamic", () => () => () => null);

jest.mock("framer-motion", () => {
  const ReactLib = require("react");

  return {
    __esModule: true,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement(ReactLib.Fragment, null, children),
    motion: {
      div: ReactLib.forwardRef(function Div(
        {
          children,
          ...props
        }: React.HTMLAttributes<HTMLDivElement> & {
          readonly children: React.ReactNode;
        },
        ref: React.Ref<HTMLDivElement>
      ) {
        return ReactLib.createElement("div", { ...props, ref }, children);
      }),
    },
  };
});

jest.mock("react-redux", () => ({
  useSelector: jest.fn(() => null),
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
  </div>
));
jest.mock("@/components/waves/CreateDropInput", () => () => (
  <div data-testid="input" />
));
jest.mock("@/components/waves/CreateDropContentRequirements", () => () => (
  <div data-testid="requirements" />
));
jest.mock("@/components/waves/CreateDropMetadata", () => () => (
  <div data-testid="metadata" />
));
jest.mock("@/components/waves/CreateDropContentFiles", () => ({
  CreateDropContentFiles: () => <div data-testid="files" />,
}));
jest.mock("@/components/waves/CreateDropSubmit", () => ({
  CreateDropSubmit: (props: any) => (
    <button type="button" onClick={() => void props.onDrop()}>
      submit
    </button>
  ),
}));
jest.mock("@/components/waves/CreateDropDropModeToggle", () => ({
  CreateDropDropModeToggle: (props: any) => (
    <button type="button" onClick={() => props.onDropModeChange(false)}>
      toggle
    </button>
  ),
}));

jest.mock("@/components/waves/CreateDropIdentityField", () => (props: any) => (
  <div data-testid="identity-field">
    <span>
      {props.selectedIdentity?.label ?? props.selfIdentity?.label ?? "none"}
    </span>
    <button type="button" onClick={props.onOpenPicker}>
      change identity
    </button>
  </div>
));

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
    requestAuth: jest.fn(async () => ({ success: true })),
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
    (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
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

  const baseWave = {
    id: "wave-1",
    wave: { type: ApiWaveType.Rank },
    chat: { enabled: true },
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

  const renderSubject = ({
    isDropMode = true,
    wave = createWave(),
    drop = null,
    submitDrop = jest.fn(),
  }: {
    readonly isDropMode?: boolean;
    readonly wave?: any;
    readonly drop?: any;
    readonly submitDrop?: jest.Mock;
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    return {
      ...utils,
      onDropModeChange,
      submitDrop,
    };
  };

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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
          submissionExperience={WaveSubmissionExperience.IDENTITY}
        />
      </ReactQueryWrapperContext.Provider>
    );

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
  });

  it("keeps the selected identity when leaving Drop mode is rejected by the parent", async () => {
    const { onDropModeChange } = renderSubject();

    await userEvent.click(screen.getByText("select other"));

    expect(screen.getByTestId("identity-field")).toHaveTextContent("other");

    await userEvent.click(screen.getByText("toggle"));

    expect(onDropModeChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId("identity-field")).toHaveTextContent("other");
    expect(
      screen.queryByTestId("identity-picker-modal")
    ).not.toBeInTheDocument();
  });

  it("keeps the picker open and shows an error when selecting the viewer identity in OnlyOthers mode", async () => {
    renderSubject();

    await userEvent.click(screen.getByText("select self"));

    expect(screen.getByTestId("identity-picker-modal")).toBeInTheDocument();
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
          privileges={{ chatRestriction: null, submissionRestriction: null }}
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
