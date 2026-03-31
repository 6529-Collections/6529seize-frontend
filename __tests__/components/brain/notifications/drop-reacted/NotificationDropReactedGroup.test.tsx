import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import NotificationDropReactedGroup from "@/components/brain/notifications/drop-reacted/NotificationDropReactedGroup";

const OverlappingAvatars = jest.fn(({ items }: { items: unknown[] }) => (
  <div data-testid="avatars">{JSON.stringify(items)}</div>
));
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

function createNotification({
  id,
  createdAt,
  reaction,
  handle,
  pfp,
}: {
  id: number;
  createdAt: number;
  reaction: string;
  handle: string;
  pfp: string | null;
}) {
  return {
    id,
    cause: "DROP_REACTED",
    created_at: createdAt,
    read_at: null,
    related_identity: {
      id: `${handle}-id`,
      handle,
      pfp,
      primary_address: `0x${handle}`,
      subscribed_actions: [],
    },
    related_drops: [
      {
        id: "drop-1",
        wave: { id: "wave-1" },
      },
    ],
    additional_context: {
      reaction,
    },
  } as never;
}

describe("NotificationDropReactedGroup", () => {
  beforeEach(() => {
    OverlappingAvatars.mockClear();
    NotificationHeader.mockClear();
  });

  it("keeps an older pfp when the latest grouped notification for that user has none", () => {
    render(
      <NotificationDropReactedGroup
        group={{
          type: "grouped_reactions",
          id: 3,
          createdAt: 200,
          drop: {
            id: "drop-1",
            wave: { id: "wave-1" },
          } as never,
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
          drop: {
            id: "drop-1",
            wave: { id: "wave-1" },
          } as never,
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
});
