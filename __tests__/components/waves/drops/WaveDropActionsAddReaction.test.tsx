import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import WaveDropActionsAddReaction from "@/components/waves/drops/WaveDropActionsAddReaction";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
import * as commonApi from "@/services/api/common-api";

const applyOptimisticDropUpdateMock = jest.fn(() => ({ rollback: jest.fn() }));
const setToastMock = jest.fn();
const mobileWrapperDialogMock = jest.fn(
  ({ isOpen, children, zIndexClassName }: any) =>
    isOpen ? (
      <div data-testid="mobile-dialog" data-z-index={zIndexClassName}>
        {children}
      </div>
    ) : null
);
const mockLoadCustomEmojis = jest.fn(() => Promise.resolve([]));
const mockLoadNativeEmojis = jest.fn(() => Promise.resolve({}));
const mockLoadEmojiData = jest.fn(() => Promise.resolve());
const mockFindNativeEmoji = jest.fn();
const mockFindCustomEmoji = jest.fn();

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

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const scope = {
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      setTag: jest.fn(),
      setExtras: jest.fn(),
    };
    callback(scope);
  }),
  captureException: jest.fn(),
}));

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebsocketStatus: jest.fn(() => "connected"),
}));

jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: (props: any) => mobileWrapperDialogMock(props),
}));

jest.mock("@emoji-mart/react", () => ({
  __esModule: true,
  default: ({ onEmojiSelect, autoFocus }: any) => (
    <div data-testid="mock-picker" data-auto-focus={String(autoFocus)}>
      <button onClick={() => onEmojiSelect({ id: "smile" })}>
        Select Emoji
      </button>
    </div>
  ),
}));
jest.mock("@emoji-mart/data", () => ({
  default: {},
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: jest.fn(() => ({
    emojiMap: [],
    emojiData: {},
    categories: [],
    categoryIcons: {},
    loading: false,
    findNativeEmoji: mockFindNativeEmoji,
    findCustomEmoji: mockFindCustomEmoji,
    loadCustomEmojis: mockLoadCustomEmojis,
    loadNativeEmojis: mockLoadNativeEmojis,
    loadEmojiData: mockLoadEmojiData,
  })),
}));

const baseDrop = {
  id: "12345",
  wave: { id: "wave-1" },
  context_profile_context: { reaction: null },
  author: { handle: "author-handle" },
  parts: [],
  metadata: [],
  drop_type: ApiDropType.Standard,
  serial_no: 1,
  created_at: new Date().toISOString(),
  reply_to: null,
  wave_messages: [],
  reactions: [],
  type: DropSize.FULL,
  stableKey: "12345",
  stableHash: "hash-12345",
} as unknown as ExtendedDrop;

const mockDrop = baseDrop;
const tempDrop = {
  ...baseDrop,
  id: "temp-001",
  stableKey: "temp-001",
  stableHash: "hash-temp-001",
} as ExtendedDrop;

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("WaveDropActionsAddReaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders desktop button", () => {
    renderWithQueryClient(<WaveDropActionsAddReaction drop={mockDrop} />);
    expect(
      screen.getByRole("button", { name: /add reaction/i })
    ).toBeInTheDocument();
  });

  it("renders mobile button", () => {
    renderWithQueryClient(
      <WaveDropActionsAddReaction drop={mockDrop} isMobile={true} />
    );
    expect(
      screen.getByRole("button", { name: /add reaction/i })
    ).toBeInTheDocument();
  });

  it("disables button when drop is temporary", () => {
    renderWithQueryClient(<WaveDropActionsAddReaction drop={tempDrop} />);
    const button = screen.getByRole("button", { name: /add reaction/i });
    expect(button).toBeDisabled();
  });

  it("opens and closes picker on desktop button click", async () => {
    renderWithQueryClient(<WaveDropActionsAddReaction drop={mockDrop} />);
    const button = screen.getByRole("button", { name: /add reaction/i });

    fireEvent.click(button);
    expect(await screen.findByTestId("mock-picker")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByTestId("mock-picker")).not.toBeInTheDocument();
    });
  });

  it("closes picker on outside click", async () => {
    renderWithQueryClient(<WaveDropActionsAddReaction drop={mockDrop} />);
    const button = screen.getByRole("button", { name: /add reaction/i });

    fireEvent.click(button);
    expect(await screen.findByTestId("mock-picker")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByTestId("mock-picker")).not.toBeInTheDocument();
    });
  });

  it("calls onAddReaction when emoji selected", async () => {
    const onAddReactionMock = jest.fn();
    renderWithQueryClient(
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

  it("shows the structured API error message when adding a reaction fails", async () => {
    (commonApi.commonApiPost as jest.Mock).mockRejectedValueOnce(
      new Error("Unauthorized")
    );

    renderWithQueryClient(<WaveDropActionsAddReaction drop={mockDrop} />);

    fireEvent.click(screen.getByRole("button", { name: /add reaction/i }));
    fireEvent.click(await screen.findByText(/select emoji/i));

    await waitFor(() => {
      expect(setToastMock).toHaveBeenCalledWith({
        message: "Unauthorized",
        type: "error",
      });
    });
  });

  it("opens and closes picker on mobile button click", async () => {
    renderWithQueryClient(
      <WaveDropActionsAddReaction drop={mockDrop} isMobile={true} />
    );
    const button = screen.getByRole("button", { name: /add reaction/i });

    fireEvent.click(button);
    expect(await screen.findByTestId("mock-picker")).toBeInTheDocument();
  });

  it("auto-focuses the picker search input on desktop", async () => {
    renderWithQueryClient(<WaveDropActionsAddReaction drop={mockDrop} />);

    fireEvent.click(screen.getByRole("button", { name: /add reaction/i }));

    expect(await screen.findByTestId("mock-picker")).toHaveAttribute(
      "data-auto-focus",
      "true"
    );
  });

  it("auto-focuses the picker search input on mobile", async () => {
    renderWithQueryClient(
      <WaveDropActionsAddReaction drop={mockDrop} isMobile={true} />
    );

    fireEvent.click(screen.getByRole("button", { name: /add reaction/i }));

    expect(await screen.findByTestId("mock-picker")).toHaveAttribute(
      "data-auto-focus",
      "true"
    );
  });

  it("forwards custom dialog z-index to the mobile wrapper", async () => {
    renderWithQueryClient(
      <WaveDropActionsAddReaction
        drop={mockDrop}
        isMobile={true}
        dialogZIndexClassName="tw-z-[1030]"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /add reaction/i }));

    expect(await screen.findByTestId("mobile-dialog")).toHaveAttribute(
      "data-z-index",
      "tw-z-[1030]"
    );
  });
});
