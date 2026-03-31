import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import NotificationDropReactedGroup from "@/components/brain/notifications/drop-reacted/NotificationDropReactedGroup";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type {
  GroupedReactionsItem,
  INotificationDropReacted,
} from "@/types/feed.types";

const OverlappingAvatars = jest.fn(({ items }: { items: unknown[] }) => (
  <div data-testid="avatars">{JSON.stringify(items)}</div>
));
let consoleWarnSpy: jest.SpyInstance;

const NotificationHeader = jest.fn(
  ({
    author,
    actions,
    children,
  }: {
    author: { handle?: string | null; pfp?: string | null };
    actions?: ReactNode;
    children: ReactNode;
  }) => (
    <div data-testid="header">
      <span>{author.handle}</span>
      <span>{author.pfp}</span>
      {children}
      {actions}
    </div>
  )
);

jest.mock("@/components/common/OverlappingAvatars", () => ({
  __esModule: true,
  default: (props: { items: unknown[] }) => OverlappingAvatars(props),
}));

jest.mock("@/components/brain/notifications/NotificationsFollowAllBtn", () => ({
  __esModule: true,
  default: () => <div data-testid="follow-all" />,
}));

jest.mock("@/components/brain/notifications/NotificationsFollowBtn", () => ({
  __esModule: true,
  default: () => <div data-testid="follow-one" />,
}));

jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationHeader",
  () => ({
    __esModule: true,
    default: (props: {
      author: { handle?: string | null; pfp?: string | null };
      actions?: ReactNode;
      children: ReactNode;
    }) => NotificationHeader(props),
  })
);

jest.mock("@/components/brain/notifications/subcomponents/NotificationDrop", () => ({
  __esModule: true,
  default: () => <div data-testid="drop" />,
}));

jest.mock(
  "@/components/brain/notifications/drop-reacted/ReactionEmojiPreview",
  () => ({
    __esModule: true,
    default: ({ rawId }: { rawId: string }) => <span>{rawId}</span>,
  })
);

jest.mock(
  "@/components/brain/notifications/subcomponents/NotificationTimestamp",
  () => ({
    __esModule: true,
    default: ({ createdAt }: { createdAt: number }) => (
      <span>{createdAt}</span>
    ),
  })
);

jest.mock(
  "@/components/brain/notifications/utils/navigationUtils",
  () => ({
    __esModule: true,
    getIsDirectMessage: () => false,
    useWaveNavigation: () => ({
      createReplyClickHandler: () => jest.fn(),
      createQuoteClickHandler: () => jest.fn(),
    }),
  })
);

function createMockProfile(
  overrides: Partial<ApiProfileMin> & { handle: string }
): ApiProfileMin {
  return {
    id: overrides.id ?? `${overrides.handle}-id`,
    handle: overrides.handle,
    pfp: overrides.pfp ?? null,
    banner1_color: overrides.banner1_color ?? null,
    banner2_color: overrides.banner2_color ?? null,
    cic: overrides.cic ?? 0,
    rep: overrides.rep ?? 0,
    tdh: overrides.tdh ?? 0,
    tdh_rate: overrides.tdh_rate ?? 0,
    xtdh: overrides.xtdh ?? 0,
    xtdh_rate: overrides.xtdh_rate ?? 0,
    level: overrides.level ?? 0,
    primary_address: overrides.primary_address ?? `0x${overrides.handle}`,
    subscribed_actions: overrides.subscribed_actions ?? [],
    archived: overrides.archived ?? false,
    active_main_stage_submission_ids:
      overrides.active_main_stage_submission_ids ?? [],
    winner_main_stage_drop_ids: overrides.winner_main_stage_drop_ids ?? [],
    artist_of_prevote_cards: overrides.artist_of_prevote_cards ?? [],
    is_wave_creator: overrides.is_wave_creator ?? false,
  };
}

function createMockDrop(): GroupedReactionsItem["drop"] {
  return {
    id: "drop-1",
    wave: { id: "wave-1" },
  } as GroupedReactionsItem["drop"];
}

function createNotification({
  id,
  createdAt,
  reaction,
  handle,
  pfp,
  profileOverrides,
}: {
  id: number;
  createdAt: number;
  reaction: string;
  handle: string;
  pfp: string | null;
  profileOverrides?: Partial<ApiProfileMin>;
}): INotificationDropReacted {
  return {
    id,
    cause: ApiNotificationCause.DropReacted,
    created_at: createdAt,
    read_at: null,
    related_identity: createMockProfile({
      handle,
      pfp,
      primary_address: `0x${handle}`,
      ...profileOverrides,
    }),
    related_drops: [createMockDrop()],
    additional_context: {
      reaction,
    },
  };
}

describe("NotificationDropReactedGroup", () => {
  beforeEach(() => {
    OverlappingAvatars.mockClear();
    NotificationHeader.mockClear();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it("keeps an older pfp when the latest grouped notification for that user has none", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 3,
          createdAt: 200,
          drop: createMockDrop(),
          notifications: [
            createNotification({
              id: 1,
              createdAt: 100,
              reaction: ":heart:",
              handle: "gpebbles",
              pfp: "alice.png",
            }),
            createNotification({
              id: 2,
              createdAt: 200,
              reaction: ":heart:",
              handle: "gpebbles",
              pfp: null,
            }),
            createNotification({
              id: 3,
              createdAt: 150,
              reaction: ":fire:",
              handle: "prxt0",
              pfp: "bob.png",
            }),
          ],
        }}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(screen.getByText("New reactions")).toBeInTheDocument();
    expect(OverlappingAvatars).toHaveBeenCalled();
    expect(OverlappingAvatars.mock.calls[0]?.[0]?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "gpebbles-id",
          pfpUrl: "alice.png",
          fallback: "GP",
        }),
      ])
    );
  });

  it("renders single-actor copy when deduping leaves one visible reactor", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 2,
          createdAt: 200,
          drop: createMockDrop(),
          notifications: [
            createNotification({
              id: 1,
              createdAt: 100,
              reaction: ":heart:",
              handle: "gpebbles",
              pfp: "gpebbles.png",
            }),
            createNotification({
              id: 2,
              createdAt: 200,
              reaction: ":heart:",
              handle: "gpebbles",
              pfp: null,
            }),
          ],
        }}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(screen.queryByText("New reactions")).not.toBeInTheDocument();
    expect(screen.getByTestId("header")).toHaveTextContent("gpebbles");
    expect(screen.getByTestId("header")).toHaveTextContent("gpebbles.png");
    expect(screen.getByText("reacted")).toBeInTheDocument();
    expect(screen.getByTestId("follow-one")).toBeInTheDocument();
    expect(screen.queryByTestId("follow-all")).not.toBeInTheDocument();
  });

  it("keeps an older handle when the latest grouped notification has a blank handle", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 2,
          createdAt: 200,
          drop: createMockDrop(),
          notifications: [
            createNotification({
              id: 1,
              createdAt: 100,
              reaction: ":heart:",
              handle: "gpebbles",
              pfp: "gpebbles.png",
              profileOverrides: {
                id: "reactor-1",
                primary_address: "0xreactor1",
              },
            }),
            createNotification({
              id: 2,
              createdAt: 200,
              reaction: ":heart:",
              handle: "",
              pfp: null,
              profileOverrides: {
                id: "reactor-1",
                primary_address: "0xreactor1",
              },
            }),
          ],
        }}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(screen.queryByText("New reactions")).not.toBeInTheDocument();
    expect(screen.getByTestId("header")).toHaveTextContent("gpebbles");
    expect(screen.getByTestId("follow-one")).toBeInTheDocument();
  });

  it("dedupes the same reactor when later notifications identify them by a different alias", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 2,
          createdAt: 200,
          drop: createMockDrop(),
          notifications: [
            createNotification({
              id: 1,
              createdAt: 100,
              reaction: ":heart:",
              handle: "gpebbles",
              pfp: "gpebbles.png",
              profileOverrides: {
                id: "profile-1",
                primary_address: "0xabc",
              },
            }),
            createNotification({
              id: 2,
              createdAt: 200,
              reaction: ":heart:",
              handle: "",
              pfp: null,
              profileOverrides: {
                id: "",
                primary_address: "0xabc",
              },
            }),
          ],
        }}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(screen.queryByText("New reactions")).not.toBeInTheDocument();
    expect(screen.getByTestId("header")).toHaveTextContent("gpebbles");
    expect(screen.getByTestId("header")).toHaveTextContent("gpebbles.png");
  });

  it("keeps accumulated identity data when folding an older notification into an existing reactor", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 3,
          createdAt: 300,
          drop: createMockDrop(),
          notifications: [
            createNotification({
              id: 3,
              createdAt: 300,
              reaction: ":heart:",
              handle: "",
              pfp: null,
              profileOverrides: {
                id: "reactor-1",
                primary_address: "0xreactor1",
              },
            }),
            createNotification({
              id: 2,
              createdAt: 200,
              reaction: ":heart:",
              handle: "gpebbles",
              pfp: null,
              profileOverrides: {
                id: "reactor-1",
                primary_address: "0xreactor1",
              },
            }),
            createNotification({
              id: 1,
              createdAt: 100,
              reaction: ":heart:",
              handle: "",
              pfp: "alice.png",
              profileOverrides: {
                id: "reactor-1",
                primary_address: "0xreactor1",
              },
            }),
          ],
        }}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(screen.queryByText("New reactions")).not.toBeInTheDocument();
    expect(screen.getByTestId("header")).toHaveTextContent("gpebbles");
    expect(screen.getByTestId("header")).toHaveTextContent("alice.png");
  });

  it("falls back to the multi-reactor layout when the only reactor has no usable handle", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 1,
          createdAt: 200,
          drop: createMockDrop(),
          notifications: [
            createNotification({
              id: 1,
              createdAt: 200,
              reaction: ":heart:",
              handle: "",
              pfp: null,
              profileOverrides: {
                id: "reactor-1",
                primary_address: "",
              },
            }),
          ],
        }}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(screen.getByText("New reactions")).toBeInTheDocument();
    expect(screen.queryByTestId("header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("follow-one")).not.toBeInTheDocument();
  });

  it("keeps reactions with blank identity fields instead of dropping them", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 3,
          createdAt: 200,
          drop: createMockDrop(),
          notifications: [
            createNotification({
              id: 1,
              createdAt: 100,
              reaction: ":heart:",
              handle: "",
              pfp: null,
              profileOverrides: {
                id: "",
                primary_address: "",
              },
            }),
            createNotification({
              id: 2,
              createdAt: 150,
              reaction: ":fire:",
              handle: "prxt0",
              pfp: "bob.png",
            }),
          ],
        }}
        activeDrop={null}
        onReply={jest.fn()}
      />
    );

    expect(OverlappingAvatars).toHaveBeenCalled();
    const avatarItems = OverlappingAvatars.mock.calls.flatMap(
      (call) => (call[0]?.items as unknown[]) ?? []
    );
    expect(avatarItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "unknown-identity-1",
        }),
        expect.objectContaining({
          key: "prxt0-id",
        }),
      ])
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "NotificationDropReactedGroup received a reaction without a usable identity key",
      expect.objectContaining({
        notificationId: 1,
      })
    );
  });
});
