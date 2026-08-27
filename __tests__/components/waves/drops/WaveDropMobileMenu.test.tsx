import { AuthContext } from "@/components/auth/Auth";
import WaveDropMobileMenu from "@/components/waves/drops/WaveDropMobileMenu";
import { WaveDropLayerProvider } from "@/components/waves/drops/WaveDropLayerContext";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useCapacitor from "@/hooks/useCapacitor";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import userEvent from "@testing-library/user-event";

const mockIsMemesWave = jest.fn();
const mockIsQuorumWave = jest.fn();
const writeText = jest.fn().mockResolvedValue(undefined);
const addReactionMock = jest.fn((props: any) => (
  <button
    type="button"
    data-testid="add-reaction"
    data-dialog-z-index={props.dialogZIndexClassName}
    onClick={props.onMobilePickerOpen}
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
jest.mock("@/hooks/useCapacitor");
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
  "@/components/waves/drops/WaveDropMobileMenuReactionPicker",
  () => () => <div data-testid="reaction-picker" />
);
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: (props: any) => mobileWrapperMock(props),
}));

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
const mockedUseCapacitor = jest.mocked(useCapacitor);
type AuthProviderValue = ComponentProps<typeof AuthContext.Provider>["value"];

const unauthenticatedAuth: AuthProviderValue = {
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  showWaves: false,
  sessionUpgradeRequired: false,
  requestAuth: jest.fn(async () => ({ success: false })),
  requestSessionUpgrade: jest.fn(async () => ({ success: false })),
  ensureActiveSessionV2WebSession: jest.fn(async () => false),
  setToast: jest.fn(),
  setActiveProfileProxy: jest.fn(async () => {}),
};

const dropFixture = {
  id: "1",
  serial_no: 1,
  drop_type: ApiDropType.Chat,
  rank: null,
  wave: {
    id: "w",
    name: "Test wave",
    picture: null,
    description_drop_id: "description-drop",
    last_drop_time: 0,
    submission_type: null,
    authenticated_user_eligible_to_vote: true,
    authenticated_user_eligible_to_participate: true,
    authenticated_user_eligible_to_chat: true,
    authenticated_user_admin: false,
    visibility_group_id: null,
    participation_group_id: null,
    chat_group_id: null,
    voting_group_id: null,
    admin_group_id: null,
    voting_period_start: null,
    voting_period_end: null,
    voting_credit_type: ApiWaveCreditType.Tdh,
    voting_credit_scope: ApiWaveCreditScope.Wave,
    voting_credit_nfts: null,
    admin_drop_deletion_enabled: false,
    forbid_negative_votes: false,
    pinned: false,
    identity_wave: false,
  },
  author: {
    id: "author-1",
    handle: "alice",
    pfp: null,
    banner1_color: null,
    banner2_color: null,
    cic: 0,
    rep: 0,
    tdh: 0,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    level: 1,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    primary_address: "0x0000000000000000000000000000000000000000",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: false,
  },
  created_at: 0,
  updated_at: null,
  title: null,
  parts: [],
  parts_count: 0,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  metadata: [],
  rating: 0,
  realtime_rating: 0,
  rating_prediction: 0,
  top_raters: [],
  raters_count: 0,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  reactions: [],
  boosts: 0,
  is_additional_action_promised: false,
  hide_link_preview: false,
} satisfies ApiDrop;

beforeEach(() => {
  writeText.mockClear();
  addReactionMock.mockClear();
  mobileWrapperMock.mockClear();
  mockIsMemesWave.mockReturnValue(false);
  mockIsQuorumWave.mockReturnValue(false);
  mockedUseCapacitor.mockReturnValue({ isCapacitor: false } as ReturnType<
    typeof useCapacitor
  >);
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

test("does not hide the native drop action sheet when desktop hover CSS is active", () => {
  mockedUseCapacitor.mockReturnValue({ isCapacitor: true } as ReturnType<
    typeof useCapacitor
  >);

  render(
    <AuthContext.Provider value={unauthenticatedAuth}>
      <WaveDropMobileMenu
        drop={dropFixture}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(mobileWrapperMock.mock.calls.at(-1)?.[0]).toEqual(
    expect.objectContaining({ hideOnDesktopHover: false })
  );
});

test("preserves desktop-hover hiding outside the native app", () => {
  render(
    <AuthContext.Provider value={unauthenticatedAuth}>
      <WaveDropMobileMenu
        drop={dropFixture}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  expect(mobileWrapperMock.mock.calls.at(-1)?.[0]).toEqual(
    expect.objectContaining({ hideOnDesktopHover: true })
  );
});

test("does not show mobile download actions for media", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Chat,
    author: { handle: "alice" },
    parts: [
      {
        media: [{ url: "https://example.com/first.png" }],
        attachments: [{ url: "https://example.com/attachment.pdf" }],
      },
      {
        media: [{ url: "https://example.com/second.mp4" }],
        attachments: [],
      },
    ],
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

  expect(screen.queryByText("Download media")).toBeNull();
});

test("shows clap by default for non-author profiles", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Participatory,
    author: { handle: "alice" },
  } as unknown as ApiDrop;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "bob" },
          activeProfileProxy: null,
        } as unknown as AuthProviderValue
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

  expect(screen.getByTestId("clap")).toBeInTheDocument();
});

test("shows one Flag Content action as the final authenticated mobile menu entry", () => {
  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { id: "viewer-1", handle: "bob" },
          activeProfileProxy: null,
        } as unknown as AuthProviderValue
      }
    >
      <WaveDropMobileMenu
        drop={dropFixture}
        isOpen
        showReplyAndQuote
        longPressTriggered={false}
        setOpen={jest.fn()}
        onReply={jest.fn()}
        onAddReaction={jest.fn()}
      />
    </AuthContext.Provider>
  );

  const reportAction = screen.getByRole("button", { name: "Flag Content" });
  expect(reportAction.parentElement?.lastElementChild).toBe(reportAction);
  expect(screen.queryByRole("button", { name: "Hide post" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Block author" })).toBeNull();
});

test("hides clap when voting is hidden", () => {
  const drop = {
    id: "1",
    serial_no: 1,
    wave: { id: "w" },
    drop_type: ApiDropType.Participatory,
    author: { handle: "alice" },
  } as unknown as ApiDrop;

  render(
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "bob" },
          activeProfileProxy: null,
        } as unknown as AuthProviderValue
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
        showVoting={false}
      />
    </AuthContext.Provider>
  );

  expect(screen.queryByTestId("clap")).toBeNull();
  expect(screen.getByTestId("mark-unread")).toBeInTheDocument();
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

test("uses the single-drop mobile menu layer override", () => {
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
});

test("preserves the default mobile menu layer when its override is undefined", () => {
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
});

test("resets the reaction view when the underlying drop changes", async () => {
  const user = userEvent.setup();
  const renderMenu = (drop: ApiDrop) => (
    <AuthContext.Provider
      value={
        {
          connectedProfile: { handle: "alice" },
          activeProfileProxy: null,
        } as AuthProviderValue
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
  const { rerender } = render(renderMenu(dropFixture));

  await user.click(screen.getByTestId("add-reaction"));
  expect(screen.getByTestId("reaction-picker")).toBeInTheDocument();

  rerender(renderMenu({ ...dropFixture, id: "2" }));

  expect(screen.queryByTestId("reaction-picker")).not.toBeInTheDocument();
  expect(screen.getByTestId("add-reaction")).toBeInTheDocument();
});
