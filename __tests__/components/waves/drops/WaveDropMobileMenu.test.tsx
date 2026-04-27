import { AuthContext } from "@/components/auth/Auth";
import WaveDropMobileMenu from "@/components/waves/drops/WaveDropMobileMenu";
import { WaveDropLayerProvider } from "@/components/waves/drops/WaveDropLayerContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockIsMemesWave = jest.fn();
const mockIsQuorumWave = jest.fn();
const writeText = jest.fn().mockResolvedValue(undefined);
const addReactionMock = jest.fn((props: any) => (
  <div
    data-testid="add-reaction"
    data-dialog-z-index={props.dialogZIndexClassName}
  />
));
const mobileWrapperMock = jest.fn((props: any) =>
  props.isOpen ? (
    <div data-testid="wrapper" data-z-index={props.zIndexClassName}>
      {props.children}
    </div>
  ) : null
);

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
}));
jest.mock("@/hooks/drops/useCanShowDropCurationsAction", () => ({
  useCanShowDropCurationsAction: jest.fn(() => false),
}));
jest.mock("@/components/waves/drops/WaveDropMobileMenuDelete", () => () => (
  <div data-testid="delete" />
));
jest.mock(
  "@/components/waves/drops/WaveDropMobileMenuSetPinnedDrop",
  () => () => <div data-testid="set-pinned-drop" />
);
jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => () => (
  <div data-testid="open" />
));
jest.mock("@/components/waves/drops/WaveDropMobileMenuBoost", () => () => (
  <div data-testid="boost" />
));
jest.mock("@/components/waves/drops/WaveDropActionsMarkUnread", () => () => (
  <div data-testid="mark-unread" />
));
jest.mock("@/components/waves/drops/WaveDropActionsRate", () => () => (
  <div data-testid="clap" />
));
jest.mock("@/components/waves/drops/WaveDropActionsAddReaction", () => ({
  __esModule: true,
  default: (props: any) => addReactionMock(props),
}));
jest.mock("@/components/waves/drops/WaveDropActionsQuickReact", () => () => (
  <div data-testid="quick-react" />
));
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => ({
    __esModule: true,
    default: (props: any) => mobileWrapperMock(props),
  })
);

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    isMemesWave: mockIsMemesWave,
    isQuorumWave: mockIsQuorumWave,
  }),
}));
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    loading: false,
    categories: [],
    categoryIcons: {},
    findNativeEmoji: jest.fn(),
    findCustomEmoji: jest.fn(),
  }),
  EmojiProvider: ({ children }: any) => children,
}));
jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://base" },
}));

beforeAll(() => {
  Object.assign(navigator, {
    clipboard: { writeText },
  });
});

const mockedUseDropInteractionRules = jest.mocked(useDropInteractionRules);

beforeEach(() => {
  writeText.mockClear();
  addReactionMock.mockClear();
  mobileWrapperMock.mockClear();
  mockIsMemesWave.mockReturnValue(false);
  mockIsQuorumWave.mockReturnValue(false);
  mockedUseDropInteractionRules.mockReturnValue({
    canShowVote: true,
    canVote: true,
    voteState: "CAN_VOTE" as any,
    canDelete: true,
    canSetPinnedDrop: false,
    isAuthor: true,
    isWinner: false,
    isVotingEnded: false,
  });
});

test("copies serial jump links for non-memes drops", async () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  await userEvent.click(screen.getByText("Copy link"));
  expect(writeText).toHaveBeenCalledWith("https://base/waves/w?serialNo=1");
});

test("copies canonical drop links for memes submissions", async () => {
  mockIsMemesWave.mockReturnValue(true);

  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Participatory,
    author: { handle: "alice" },
  } as any;
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  await userEvent.click(screen.getByText("Copy link"));
  expect(writeText).toHaveBeenCalledWith("https://base/waves/w?drop=1");
});

test("copies canonical drop links for quorum participation drops", async () => {
  mockIsQuorumWave.mockReturnValue(true);

  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Participatory,
    author: { handle: "alice" },
  } as any;
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  await userEvent.click(screen.getByText("Copy link"));
  expect(writeText).toHaveBeenCalledWith("https://base/waves/w?drop=1");
});

test("hides follow and clap when author and memes wave", () => {
  mockIsMemesWave.mockReturnValue(true);

  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Participatory,
    author: { handle: "alice" },
  } as any;
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  expect(screen.queryByTestId("follow")).toBeNull();
  expect(screen.queryByTestId("clap")).toBeNull();
  expect(screen.getByTestId("delete")).toBeInTheDocument();
});

test("shows pinned-drop action in the mobile menu for admins", () => {
  mockedUseDropInteractionRules.mockReturnValue({
    canShowVote: true,
    canVote: true,
    voteState: "CAN_VOTE" as any,
    canDelete: false,
    canSetPinnedDrop: true,
    isAuthor: false,
    isWinner: false,
    isVotingEnded: false,
  });

  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w", authenticated_user_admin: true },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "admin" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByTestId("set-pinned-drop")).toBeInTheDocument();
  expect(screen.queryByTestId("delete")).toBeNull();
});

test("does not show pinned-drop action in the mobile menu for non-admins", () => {
  mockedUseDropInteractionRules.mockReturnValue({
    canShowVote: true,
    canVote: true,
    voteState: "CAN_VOTE" as any,
    canDelete: true,
    canSetPinnedDrop: false,
    isAuthor: true,
    isWinner: false,
    isVotingEnded: false,
  });

  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w", authenticated_user_admin: false },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.queryByTestId("set-pinned-drop")).toBeNull();
});

test("shows full menu when a profile handle is present", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByText("Copy link")).toBeInTheDocument();
  expect(screen.getByTestId("quick-react")).toBeInTheDocument();
  expect(screen.getByTestId("add-reaction")).toBeInTheDocument();
  expect(screen.getByText("Reply")).toBeInTheDocument();
  expect(screen.getByTestId("boost")).toBeInTheDocument();
  expect(screen.getByTestId("open")).toBeInTheDocument();
  expect(screen.getByTestId("delete")).toBeInTheDocument();
});

test("shows only copy link in the mobile menu for guests", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: null,
          activeProfileProxy: null,
        } as any
      }
    >
      <WaveDropMobileMenu
        drop={drop}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.getByText("Copy link")).toBeInTheDocument();
  expect(screen.queryByTestId("quick-react")).toBeNull();
  expect(screen.queryByTestId("add-reaction")).toBeNull();
  expect(screen.queryByText("Reply")).toBeNull();
  expect(screen.queryByTestId("boost")).toBeNull();
  expect(screen.queryByTestId("open")).toBeNull();
  expect(screen.queryByTestId("mark-unread")).toBeNull();
  expect(screen.queryByTestId("clap")).toBeNull();
  expect(screen.queryByTestId("set-pinned-drop")).toBeNull();
  expect(screen.queryByTestId("delete")).toBeNull();
});

test("uses single-drop layer overrides when provided by context", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;

  render(
    <WaveDropLayerProvider
      value={{
        mobileMenuZIndexClassName: "tw-z-[1020]",
        mobileDialogZIndexClassName: "tw-z-[1030]",
      }}
    >
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "alice" },
            activeProfileProxy: null,
          } as any
        }
      >
        <WaveDropMobileMenu
          drop={drop}
          isOpen
          showReplyAndQuote
          longPressTriggered={false}
          setOpen={jest.fn()}
          onReply={jest.fn()}
          onAddReaction={jest.fn()}
        />
      </AuthContext.Provider>
    </WaveDropLayerProvider>
  );

  expect(screen.getByTestId("wrapper")).toHaveAttribute(
    "data-z-index",
    "tw-z-[1020]"
  );
  expect(screen.getByTestId("add-reaction")).toHaveAttribute(
    "data-dialog-z-index",
    "tw-z-[1030]"
  );
});

test("preserves default layer values when context overrides are undefined", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
  } as any;

  render(
    <WaveDropLayerProvider
      value={{
        mobileMenuZIndexClassName: undefined,
        mobileDialogZIndexClassName: "tw-z-[1030]",
      }}
    >
      <AuthContext.Provider
        value={
          {
            connectedProfile: { handle: "alice" },
            activeProfileProxy: null,
          } as any
        }
      >
        <WaveDropMobileMenu
          drop={drop}
          isOpen
          showReplyAndQuote
          longPressTriggered={false}
          setOpen={jest.fn()}
          onReply={jest.fn()}
          onAddReaction={jest.fn()}
        />
      </AuthContext.Provider>
    </WaveDropLayerProvider>
  );

  expect(screen.getByTestId("wrapper")).toHaveAttribute(
    "data-z-index",
    "tw-z-[1000]"
  );
  expect(screen.getByTestId("add-reaction")).toHaveAttribute(
    "data-dialog-z-index",
    "tw-z-[1030]"
  );
});
