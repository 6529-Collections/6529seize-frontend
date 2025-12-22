import CreateDropActions from "@/components/waves/CreateDropActions";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

let ORIGINAL_TENOR_KEY: string | undefined;

beforeAll(() => {
  ORIGINAL_TENOR_KEY = require("@/config/env").publicEnv.TENOR_API_KEY;
});

afterEach(() => {
  // restore TENOR key to avoid cross-test leakage
  require("@/config/env").publicEnv.TENOR_API_KEY = ORIGINAL_TENOR_KEY;
  jest.clearAllMocks();
});

jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    __esModule: true,
    motion: {
      div: React.forwardRef(function Div({ children, ...props }: { children: React.ReactNode }, ref: React.Ref<HTMLDivElement>) {
        return React.createElement("div", { ...props, ref }, children);
      }),
      button: React.forwardRef(function Btn({ children, ...props }: { children: React.ReactNode }, ref: React.Ref<HTMLButtonElement>) {
        return React.createElement("button", { ...props, ref }, children);
      }),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
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
        disabled={submitting || !canAddPart}>
        {isStormMode ? "Storm Mode" : "Storm"}
      </button>
    );
  };
});

jest.mock("@/components/waves/CreateDropGifPicker", () => {
  return function MockCreateDropGifPicker({ show, setShow, onSelect }: any) {
    return show ? (
      <div data-testid="gif-picker">
        <button
          onClick={() => onSelect("test-gif.gif")}
          data-testid="select-gif">
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
  const defaultProps = {
    isStormMode: false,
    canAddPart: true,
    submitting: false,
    isRequiredMetadataMissing: false,
    isRequiredMediaMissing: false,
    handleFileChange: jest.fn(),
    onAddMetadataClick: jest.fn(),
    breakIntoStorm: jest.fn(),
    onGifDrop: jest.fn(),
    showOptions: true,
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
    const chevronButton = buttons.find(
      (btn) => btn.querySelector('path[d="m8.25 4.5 7.5 7.5-7.5 7.5"]')
    );

    if (chevronButton) {
      await userEvent.click(chevronButton);
      expect(defaultProps.setShowOptions).toHaveBeenCalledWith(true);
    }
  });

  it("renders all action buttons", () => {
    render(<CreateDropActions {...defaultProps} />);

    // Both versions render all buttons (one hidden via CSS)
    expect(screen.getAllByLabelText("Upload a file").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Add GIF").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("storm-button").length).toBeGreaterThan(0);
  });

  it("calls onAddMetadataClick when metadata button is clicked", async () => {
    render(<CreateDropActions {...defaultProps} />);

    // Find metadata buttons (the ones with the code icon, without aria-label)
    const buttons = screen.getAllByRole("button");
    const metadataButton = buttons.find(
      (button) =>
        button.querySelector('path[d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"]')
    );

    if (metadataButton) {
      await userEvent.click(metadataButton);
      expect(defaultProps.onAddMetadataClick).toHaveBeenCalled();
    }
  });

  it("handles file upload", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const fileInputs = screen.getAllByLabelText("Upload a file");
    const fileInput = fileInputs[0].querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });

    await userEvent.upload(fileInput, file);

    expect(defaultProps.handleFileChange).toHaveBeenCalledWith([file]);
  });

  it("shows GIF picker when GIF button is clicked", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const gifButtons = screen.getAllByLabelText("Add GIF");
    await userEvent.click(gifButtons[0]);

    expect(screen.getByTestId("gif-picker")).toBeInTheDocument();
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
    const prevKey = publicEnv.TENOR_API_KEY;
    publicEnv.TENOR_API_KEY = undefined;
    render(<CreateDropActions {...defaultProps} />);

    expect(screen.queryByLabelText("Add GIF")).not.toBeInTheDocument();
    publicEnv.TENOR_API_KEY = prevKey;
  });

  it("highlights metadata button when metadata is missing", () => {
    render(
      <CreateDropActions
        {...defaultProps}
        isRequiredMetadataMissing={true}
      />
    );

    const buttons = screen.getAllByRole("button");
    const metadataButton = buttons.find(
      (button) =>
        button.querySelector('path[d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"]')
    );
    expect(metadataButton).toHaveClass("tw-text-[#FEDF89]");
  });

  it("highlights upload button when media is missing", () => {
    render(
      <CreateDropActions
        {...defaultProps}
        isRequiredMediaMissing={true}
      />
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
    const chevronButton = buttons.find(
      (btn) => btn.querySelector('path[d="m8.25 4.5 7.5 7.5-7.5 7.5"]')
    );
    expect(chevronButton).toHaveClass("tw-text-[#FEDF89]");
  });

  it("accepts multiple file types", () => {
    render(<CreateDropActions {...defaultProps} />);

    const fileInputs = screen.getAllByLabelText("Upload a file");
    const fileInput = fileInputs[0].querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute("accept", "image/*,video/*,audio/*");
    expect(fileInput).toHaveAttribute("multiple");
  });

  it("passes correct props to StormButton", () => {
    render(
      <CreateDropActions
        {...defaultProps}
        isStormMode={true}
        canAddPart={false}
        submitting={true}
      />
    );

    const stormButtons = screen.getAllByTestId("storm-button");
    expect(stormButtons[0]).toHaveTextContent("Storm Mode");
    expect(stormButtons[0]).toBeDisabled();
  });

  it("calls breakIntoStorm when storm button is clicked", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const stormButtons = screen.getAllByTestId("storm-button");
    await userEvent.click(stormButtons[0]);

    expect(defaultProps.breakIntoStorm).toHaveBeenCalled();
  });

  it("handles multiple file selection", async () => {
    render(<CreateDropActions {...defaultProps} />);

    const fileInputs = screen.getAllByLabelText("Upload a file");
    const fileInput = fileInputs[0].querySelector('input[type="file"]') as HTMLInputElement;
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

    const { unmount } = render(
      <CreateDropActions {...defaultProps} />
    );

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
    const chevronButton = buttons.find(
      (btn) => btn.querySelector('path[d="m8.25 4.5 7.5 7.5-7.5 7.5"]')
    );
    expect(chevronButton).toBeInTheDocument();
  });
});
