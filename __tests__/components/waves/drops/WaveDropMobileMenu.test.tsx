import { AuthContext } from "@/components/auth/Auth";
import WaveDropMobileMenu from "@/components/waves/drops/WaveDropMobileMenu";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
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
jest.mock("@/components/waves/drops/WaveDropActionsAddReaction", () => () => (
  <div data-testid="add-reaction" />
));
jest.mock("@/components/waves/drops/WaveDropActionsQuickReact", () => () => (
  <div data-testid="quick-react" />
));
jest.mock(
  "@/components/waves/drops/WaveDropActionsToggleLinkPreview",
  () => () => <div data-testid="toggle-link-preview" />
);
jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => (props: any) =>
    props.isOpen ? <div data-testid="wrapper">{props.children}</div> : null
);

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({ isMemesWave: jest.fn().mockReturnValue(true) }),
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

jest.doMock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://base" },
}));

beforeAll(() => {
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
});

const mockedUseDropInteractionRules = jest.mocked(useDropInteractionRules);

beforeEach(() => {
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

test("copies link and shows feedback", async () => {
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
        onQuote={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  await userEvent.click(screen.getByText("Copy link"));
  expect(navigator.clipboard.writeText).toHaveBeenCalled();
});

test("hides follow and clap when author and memes wave", () => {
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
        onQuote={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );
  expect(screen.queryByTestId("follow")).toBeNull();
  expect(screen.queryByTestId("clap")).toBeNull();
  expect(screen.queryByTestId("toggle-link-preview")).toBeNull();
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
        onQuote={jest.fn()}
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
        onQuote={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(screen.queryByTestId("set-pinned-drop")).toBeNull();
});
