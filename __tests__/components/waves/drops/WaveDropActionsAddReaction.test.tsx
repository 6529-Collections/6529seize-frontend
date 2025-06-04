import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WaveDropActionsAddReaction from "../../../../components/waves/drops/WaveDropActionsAddReaction";

// Mock emoji-mart/react Picker and emoji-mart/data
jest.mock("@emoji-mart/react", () => ({
  __esModule: true,
  default: ({ onEmojiSelect }: any) => (
    <div data-testid="mock-picker">
      <button onClick={() => onEmojiSelect({ id: "smile" })}>
        Select Emoji
      </button>
    </div>
  ),
}));
jest.mock("@emoji-mart/data", () => ({
  default: {},
}));

// Mock useEmoji
jest.mock("../../../../contexts/EmojiContext", () => ({
  useEmoji: jest.fn(() => ({
    emojiMap: [],
    categories: [],
    categoryIcons: {},
  })),
}));

// Mock drop object
const mockDrop = { id: "12345" } as any;
const tempDrop = { id: "temp-001" } as any;

describe("WaveDropActionsAddReaction", () => {
  it("renders desktop button", () => {
    render(<WaveDropActionsAddReaction drop={mockDrop} />);
    expect(
      screen.getByRole("button", { name: /add reaction/i })
    ).toBeInTheDocument();
  });

  it("renders mobile button", () => {
    render(<WaveDropActionsAddReaction drop={mockDrop} isMobile={true} />);
    expect(
      screen.getByRole("button", { name: /add reaction/i })
    ).toBeInTheDocument();
  });

  it("disables button when drop is temporary", () => {
    render(<WaveDropActionsAddReaction drop={tempDrop} />);
    const button = screen.getByRole("button", { name: /add reaction/i });
    expect(button).toBeDisabled();
  });

  it("opens and closes picker on desktop button click", async () => {
    render(<WaveDropActionsAddReaction drop={mockDrop} />);
    const button = screen.getByRole("button", { name: /add reaction/i });

    fireEvent.click(button);
    expect(await screen.findByTestId("mock-picker")).toBeInTheDocument();

    // Simulate Escape key
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByTestId("mock-picker")).not.toBeInTheDocument();
    });
  });

  it("closes picker on outside click", async () => {
    render(<WaveDropActionsAddReaction drop={mockDrop} />);
    const button = screen.getByRole("button", { name: /add reaction/i });

    fireEvent.click(button);
    expect(await screen.findByTestId("mock-picker")).toBeInTheDocument();

    // Simulate outside click
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByTestId("mock-picker")).not.toBeInTheDocument();
    });
  });

  it("calls onAddReaction when emoji selected", async () => {
    const onAddReactionMock = jest.fn();
    render(
      <WaveDropActionsAddReaction
        drop={mockDrop}
        onAddReaction={onAddReactionMock}
      />
    );
    const button = screen.getByRole("button", { name: /add reaction/i });
    fireEvent.click(button);

    const emojiButton = await screen.findByText(/select emoji/i);
    fireEvent.click(emojiButton);

    await waitFor(() => {
      expect(onAddReactionMock).toHaveBeenCalled();
    });
  });

  it("opens and closes picker on mobile button click", async () => {
    render(<WaveDropActionsAddReaction drop={mockDrop} isMobile={true} />);
    const button = screen.getByRole("button", { name: /add reaction/i });

    fireEvent.click(button);
    expect(await screen.findByTestId("mock-picker")).toBeInTheDocument();
  });
});
