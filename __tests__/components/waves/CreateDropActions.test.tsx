import CreateDropActions from "@/components/waves/CreateDropActions";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

let ORIGINAL_GIPHY_KEY: string | undefined;

beforeAll(() => {
  ORIGINAL_GIPHY_KEY = require("@/config/env").publicEnv.GIPHY_API_KEY;
});

afterEach(() => {
  // restore GIPHY key to avoid cross-test leakage
  require("@/config/env").publicEnv.GIPHY_API_KEY = ORIGINAL_GIPHY_KEY;
  jest.clearAllMocks();
});

jest.mock("framer-motion", () => {
  const React = require("react");
  const serializeMotionProp = (value: unknown) =>
    value === undefined ? undefined : JSON.stringify(value);
  const createMotionComponent = (tag: "div" | "button") =>
    React.forwardRef(function MotionComponent(
      {
        children,
        initial,
        animate,
        exit,
        transition,
        ...props
      }: {
        readonly children: React.ReactNode;
        readonly initial?: unknown;
        readonly animate?: unknown;
        readonly exit?: unknown;
        readonly transition?: unknown;
      },
      ref: React.Ref<HTMLElement>
    ) {
      return React.createElement(
        tag,
        {
          ...props,
          ref,
          "data-motion-initial": serializeMotionProp(initial),
          "data-motion-animate": serializeMotionProp(animate),
          "data-motion-exit": serializeMotionProp(exit),
          "data-motion-transition": serializeMotionProp(transition),
        },
        children
      );
    });

  return {
    __esModule: true,
    motion: {
      div: createMotionComponent("div"),
      button: createMotionComponent("button"),
    },
    AnimatePresence: ({
      children,
      mode,
      initial,
    }: {
      readonly children: React.ReactNode;
      readonly mode?: string;
      readonly initial?: boolean;
    }) =>
      React.createElement(
        "div",
        {
          "data-testid": "drop-actions-animate-presence",
          "data-mode": mode,
          "data-initial": String(initial),
        },
        children
      ),
    LayoutGroup: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("@/components/waves/StormButton", () => {
  return function MockStormButton({
    isStormMode,
    canAddPart,
    submitting,
    breakIntoStorm,
  }: any) {
    return (
      <button
        data-testid="storm-button"
        onClick={breakIntoStorm}
        disabled={submitting || !canAddPart}
      >
        {isStormMode ? "Storm Mode" : "Storm"}
      </button>
    );
  };
});

jest.mock("@/components/waves/CreateDropGifPicker", () => {
  return function MockCreateDropGifPicker({
    giphyApiKey,
    show,
    setShow,
    onSelect,
  }: any) {
    return show ? (
      <div data-testid="gif-picker" data-api-key={giphyApiKey}>
        <button
          onClick={() => onSelect("test-gif.gif")}
          data-testid="select-gif"
        >
          Select GIF
        </button>
        <button onClick={() => setShow(false)} data-testid="close-gif">
          Close
        </button>
      </div>
    ) : null;
  };
});

jest.mock("@/hooks/isMobileScreen", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

describe("CreateDropActions", () => {
  const motionValue = (value: unknown) => JSON.stringify(value);
  const smoothTransition = motionValue({
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1],
  });

  const getFileInput = (): HTMLInputElement => {
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement | null;
    if (!fileInput) {
      throw new Error("File input not found");
    }
    return fileInput;
  };

  const defaultProps = {
    isStormMode: false,
    isDropMode: true,
    canAddPart: true,
    submitting: false,
    isRequiredMetadataMissing: false,
    isRequiredMediaMissing: false,
    canCreatePoll: false,
    isPollActive: false,
    handleFileChange: jest.fn(),
    onAddMetadataClick: jest.fn(),
    onTogglePoll: jest.fn(),
    breakIntoStorm: jest.fn(),
    onGifDrop: jest.fn(),
    showOptions: true,
    animateOptions: false,
    setShowOptions: jest.fn(),
  };

  it("renders chevron button in narrow container initially", () => {
    render(<CreateDropActions {...defaultProps} />);

    // In narrow container, chevron is visible initially (isExpanded=false)
    // Both wide and narrow versions are rendered but one is hidden via CSS
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("expands when chevron button is clicked and notifies parent", async () => {
    render(<CreateDropActions {...defaultProps} showOptions={false} />);

    // Find and click the chevron button (the one without aria-label in narrow container)
    const buttons = screen.getAllByRole("button");
    const chevronButton = buttons.find((btn) =>
      btn.querySelector('path[d="m8.25 4.5 7.5 7.5-7.5 7.5"]')
    );

    if (chevronButton) {
      await userEvent.click(chevronButton);
      expect(defaultProps.setShowOptions).toHaveBeenCalledWith(true);
    }
  });

  it("animates the stable shell width on first collapse", () => {
    const { rerender } = render(
      <CreateDropActions
        {...defaultProps}
        showOptions={true}
        animateOptions={false}
      />
    );

    expect(screen.getByTestId("drop-actions-motion-shell")).toHaveAttribute(
      "data-motion-animate",
      motionValue({ width: "auto" })
    );
    expect(screen.getByTestId("drop-actions-motion-shell")).toHaveAttribute(
      "data-motion-transition",
      motionValue({ duration: 0 })
    );

    rerender(
      <CreateDropActions
        {...defaultProps}
        showOptions={false}
        animateOptions={true}
      />
    );

    expect(screen.getByTestId("drop-actions-motion-shell")).toHaveAttribute(
      "data-motion-animate",
      motionValue({ width: "32px" })
    );
    expect(screen.getByTestId("drop-actions-motion-shell")).toHaveAttribute(
      "data-motion-transition",
      smoothTransition
    );
  });

  it("crossfades the action group and chevron with sync presence", () => {
    const { rerender } = render(
      <CreateDropActions
        {...defaultProps}
        showOptions={false}
        animateOptions={true}
      />
    );

    expect(screen.getByTestId("drop-actions-animate-presence")).toHaveAttribute(
      "data-mode",
      "sync"
    );
    expect(screen.getByTestId("drop-actions-animate-presence")).toHaveAttribute(
      "data-initial",
      "false"
    );
    expect(screen.getByTestId("drop-actions-chevron-motion")).toHaveAttribute(
      "data-motion-initial",
      motionValue({ opacity: 0, scale: 0.92 })
    );
    expect(screen.getByTestId("drop-actions-chevron-motion")).toHaveAttribute(
      "data-motion-animate",
      motionValue({ opacity: 1, scale: 1 })
    );
    expect(screen.getByTestId("drop-actions-chevron-motion")).toHaveAttribute(
      "data-motion-exit",
      motionValue({ opacity: 0, scale: 0.92 })
    );

    rerender(
      <CreateDropActions
        {...defaultProps}
        showOptions={true}
        animateOptions={true}
      />
    );

    expect(screen.getByTestId("drop-actions-expanded-motion")).toHaveAttribute(
      "data-motion-initial",
      motionValue({ opacity: 0, x: -4 })
    );
    expect(screen.getByTestId("drop-actions-expanded-motion")).toHaveAttribute(
      "data-motion-animate",
      motionValue({ opacity: 1, x: 0 })
    );
    expect(screen.getByTestId("drop-actions-expanded-motion")).toHaveAttribute(
      "data-motion-exit",
      motionValue({ opacity: 0, x: -4 })
    );
  });

  it("renders all action buttons", () => {
    render(<CreateDropActions {...defaultProps} />);

    // Both versions render all buttons (one hidden via CSS)
    expect(screen.getAllByLabelText("Upload a file").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Add GIF").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("storm-button").length).toBeGreaterThan(0);
  });

  it("renders poll action for admins and toggles it", async () => {
    render(<CreateDropActions {...defaultProps} canCreatePoll={true} />);

    const pollButton = screen.getByLabelText("Add poll");
    await userEvent.click(pollButton);

    expect(defaultProps.onTogglePoll).toHaveBeenCalled();
  });

  it("renders poll action before the storm button", () => {
    render(<CreateDropActions {...defaultProps} canCreatePoll={true} />);

    const pollButton = screen.getByLabelText("Add poll");
    const stormButton = screen.getByTestId("storm-button");
    expect(
      pollButton.compareDocumentPosition(stormButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("shows active poll action state", () => {
    render(
      <CreateDropActions
        {...defaultProps}
        canCreatePoll={true}
        isPollActive={true}
      />
    );

    const pollButton = screen.getByLabelText("Remove poll");
    expect(pollButton).toHaveAttribute("aria-pressed", "true");
    expect(pollButton).toHaveClass("tw-bg-primary-500/20");
  });

  it("calls onAddMetadataClick when metadata button is clicked", async () => {
    render(<CreateDropActions {...defaultProps} />);

    await userEvent.click(screen.getByLabelText("Add metadata"));

    expect(defaultProps.onAddMetadataClick).toHaveBeenCalled();
  });

  it("does not render metadata button in chat mode", () => {
    render(<CreateDropActions {...defaultProps} isDropMode={false} />);

    expect(screen.queryByLabelText("Add metadata")).not.toBeInTheDocument();
  });

  it("handles file upload", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const fileInput = getFileInput();
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await userEvent.upload(fileInput, file);

    expect(defaultProps.handleFileChange).toHaveBeenCalledWith([file]);
  });

  it("shows GIF picker when GIF button is clicked", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const gifButtons = screen.getAllByLabelText("Add GIF");
    await userEvent.click(gifButtons[0]);

    expect(screen.getByTestId("gif-picker")).toBeInTheDocument();
    expect(screen.getByTestId("gif-picker")).toHaveAttribute(
      "data-api-key",
      "test-giphy-api-key"
    );
  });

  it("calls onGifDrop when GIF is selected", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const gifButtons = screen.getAllByLabelText("Add GIF");
    await userEvent.click(gifButtons[0]);

    const selectGifButton = screen.getByTestId("select-gif");
    await userEvent.click(selectGifButton);

    expect(defaultProps.onGifDrop).toHaveBeenCalledWith("test-gif.gif");
  });

  it("hides GIF picker when closed", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const gifButtons = screen.getAllByLabelText("Add GIF");
    await userEvent.click(gifButtons[0]);

    expect(screen.getByTestId("gif-picker")).toBeInTheDocument();

    const closeButton = screen.getByTestId("close-gif");
    await userEvent.click(closeButton);

    expect(screen.queryByTestId("gif-picker")).not.toBeInTheDocument();
  });

  it("closes GIF picker on Escape key", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const gifButtons = screen.getAllByLabelText("Add GIF");
    await userEvent.click(gifButtons[0]);

    expect(screen.getByTestId("gif-picker")).toBeInTheDocument();

    fireEvent.keyDown(globalThis as any, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByTestId("gif-picker")).not.toBeInTheDocument();
    });
  });

  it("does not show GIF button when API key is not available", () => {
    const { publicEnv } = require("@/config/env");
    const prevKey = publicEnv.GIPHY_API_KEY;
    publicEnv.GIPHY_API_KEY = undefined;
    render(<CreateDropActions {...defaultProps} />);

    expect(screen.queryByLabelText("Add GIF")).not.toBeInTheDocument();
    publicEnv.GIPHY_API_KEY = prevKey;
  });

  it("highlights metadata button when metadata is missing", () => {
    render(
      <CreateDropActions {...defaultProps} isRequiredMetadataMissing={true} />
    );

    const metadataButton = screen.getByLabelText("Add metadata");
    expect(metadataButton).toHaveClass("tw-text-[#FEDF89]");
  });

  it("highlights upload button when media is missing", () => {
    render(
      <CreateDropActions {...defaultProps} isRequiredMediaMissing={true} />
    );

    const uploadLabels = screen.getAllByLabelText("Upload a file");
    expect(uploadLabels[0]).toHaveClass("tw-text-[#FEDF89]");
  });

  it("highlights chevron button when any required content is missing", () => {
    render(
      <CreateDropActions
        {...defaultProps}
        showOptions={false}
        isRequiredMetadataMissing={true}
        isRequiredMediaMissing={true}
      />
    );

    const buttons = screen.getAllByRole("button");
    const chevronButton = buttons.find((btn) =>
      btn.querySelector('path[d="m8.25 4.5 7.5 7.5-7.5 7.5"]')
    );
    expect(chevronButton).toHaveClass("tw-text-[#FEDF89]");
  });

  it("accepts multiple file types", () => {
    render(<CreateDropActions {...defaultProps} />);

    const fileInput = getFileInput();
    expect(fileInput).toHaveAttribute(
      "accept",
      "image/*,video/*,audio/*,application/pdf,text/csv,.pdf,.csv"
    );
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("hides the storm action after storm mode starts", () => {
    render(
      <CreateDropActions
        {...defaultProps}
        isStormMode={true}
        canAddPart={false}
        submitting={true}
      />
    );

    expect(screen.queryByTestId("storm-button")).not.toBeInTheDocument();
  });

  it("calls breakIntoStorm when storm button is clicked", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const stormButtons = screen.getAllByTestId("storm-button");
    await userEvent.click(stormButtons[0]);

    expect(defaultProps.breakIntoStorm).toHaveBeenCalled();
  });

  it("handles multiple file selection", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const fileInput = getFileInput();
    const files = [
      new File(["test1"], "test1.jpg", { type: "image/jpeg" }),
      new File(["test2"], "test2.png", { type: "image/png" }),
    ];

    await userEvent.upload(fileInput, files);

    expect(defaultProps.handleFileChange).toHaveBeenCalledWith(files);
  });

  it("cleans up event listeners on unmount", async () => {
    const removeEventListenerSpy = jest.spyOn(
      globalThis,
      "removeEventListener"
    );

    const { unmount } = render(<CreateDropActions {...defaultProps} />);

    const gifButtons = screen.getAllByLabelText("Add GIF");
    await userEvent.click(gifButtons[0]);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it("collapses when showOptions changes to false", async () => {
    const { rerender } = render(
      <CreateDropActions {...defaultProps} showOptions={true} />
    );

    // Verify buttons are visible when showOptions is true
    expect(screen.getAllByLabelText("Upload a file").length).toBeGreaterThan(0);

    // Then collapse
    rerender(<CreateDropActions {...defaultProps} showOptions={false} />);

    // When showOptions is false, only the chevron button should be visible
    const buttons = screen.getAllByRole("button");
    const chevronButton = buttons.find((btn) =>
      btn.querySelector('path[d="m8.25 4.5 7.5 7.5-7.5 7.5"]')
    );
    expect(chevronButton).toBeInTheDocument();
  });
});
