import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WaveDropActionsAddReaction from "@/components/waves/drops/WaveDropActionsAddReaction";

const applyOptimisticDropUpdateMock = jest.fn(() => ({ rollback: jest.fn() }));
const setToastMock = jest.fn();

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    applyOptimisticDropUpdate: applyOptimisticDropUpdateMock,
  })),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(() => ({
    setToast: setToastMock,
    connectedProfile: {
      id: "identity-1",
      handle: "user",
      pfp: null,
      banner1: null,
      banner2: null,
      cic: 0,
      rep: 0,
      tdh: 0,
      tdh_rate: 0,
      level: 0,
      primary_wallet: "0xuser",
      active_main_stage_submission_ids: [],
      winner_main_stage_drop_ids: [],
    },
  })),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(() => Promise.resolve({})),
}));

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
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: jest.fn(() => ({
    emojiMap: [],
    categories: [],
    categoryIcons: {},
  })),
}));

// Mock drop object
const mockDrop = {
  id: "12345",
  wave: { id: "wave-1" },
  context_profile_context: { reaction: null },
} as any;
const tempDrop = {
  id: "temp-001",
  wave: { id: "wave-1" },
  context_profile_context: { reaction: null },
} as any;

describe("WaveDropActionsAddReaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
