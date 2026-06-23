import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchNotificationsV2 } from "@/services/api/notifications-v2-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const identity = (
  handle: string,
  { subscribed = false }: { readonly subscribed?: boolean } = {}
) => ({
  id: `${handle}-id`,
  handle,
  primary_address: `0x${handle}`,
  pfp: `${handle}.png`,
  level: 1,
  classification: ApiProfileClassification.Pseudonym,
  badges: {},
  context_profile_context: {
    subscribed,
  },
});

const wave = {
  id: "wave-1",
  name: "Wave 1",
  pfp: "wave.png",
  last_drop_time: 100,
  created_at: 50,
  subscribers_count: 10,
  has_competition: false,
  is_dm_wave: true,
  description_drop: {
    id: "description-drop",
    title: "Wave 1",
    description: "Description",
  },
  total_drops_count: 1,
  is_private: false,
  context_profile_context: {
    subscribed: false,
    pinned: false,
    can_chat: true,
    unread_drops: 0,
    muted: false,
  },
};

const drop = {
  id: "drop-1",
  serial_no: 12,
  drop_type: ApiDropMainType.Chat,
  author: identity("author"),
  created_at: 1000,
  updated_at: null,
  title: null,
  content: "hello",
  media: [],
  attachments: [],
  parts_count: 1,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  reactions: [],
  boosts: 0,
  hide_link_preview: false,
  nft_links: [],
  is_signed: false,
  context_profile_context: {
    reaction: null,
    boosted: false,
    bookmarked: false,
  },
};

describe("fetchNotificationsV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches v2 notifications and expands grouped reaction reactors", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      unread_count: 1,
      notifications: [
        {
          id: 7,
          cause: ApiNotificationCause.DropReacted,
          created_at: 2000,
          read_at: null,
          related_identity: identity("fallback"),
          related_wave: wave,
          related_drops: [drop],
          additional_context: {
            reaction: ":green_circle:",
            reactors: [
              { handle: "alice", pfp: "alice.png", subscribed: true },
              { handle: "bob", pfp: "bob.png", subscribed: false },
            ],
          },
        },
      ],
    });

    const response = await fetchNotificationsV2({
      limit: "30",
      pageParam: 99,
      cause: [ApiNotificationCause.DropReacted],
    });

    expect(commonApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/notifications",
        params: {
          limit: "30",
          id_less_than: "99",
          cause: ApiNotificationCause.DropReacted,
        },
      })
    );
    expect(response.unread_count).toBe(1);
    expect(response.notifications).toHaveLength(2);
    expect(response.notifications.map((n) => n.id)).toEqual([7, 7]);
    expect(
      response.notifications.map((n) => n.related_identity.handle)
    ).toEqual(["alice", "bob"]);
    expect(
      response.notifications.map((n) => n.related_identity.subscribed_actions)
    ).toEqual([[ApiIdentitySubscriptionTargetAction.WaveCreated], []]);
    const [firstNotification] = response.notifications;
    if (
      firstNotification?.cause === ApiNotificationCause.DropReacted &&
      "related_drops" in firstNotification
    ) {
      const mappedDrop = firstNotification.related_drops[0]!;
      expect(mappedDrop.wave.id).toBe("wave-1");
      expect(mappedDrop.wave).toMatchObject({ is_direct_message: true });
      expect(mappedDrop.parts[0]?.content).toBe("hello");
      return;
    }

    throw new Error("Expected drop reacted notification");
  });

  it("preserves followed state for grouped reaction reactor matching related identity", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      unread_count: 1,
      notifications: [
        {
          id: 10,
          cause: ApiNotificationCause.DropReacted,
          created_at: 2000,
          read_at: null,
          related_identity: identity("alice", { subscribed: true }),
          related_wave: wave,
          related_drops: [drop],
          additional_context: {
            reaction: ":green_circle:",
            reactors: [
              { handle: "alice", pfp: "alice-new.png", subscribed: true },
            ],
          },
        },
      ],
    });

    const response = await fetchNotificationsV2({
      limit: "30",
      cause: [ApiNotificationCause.DropReacted],
    });

    expect(response.notifications).toHaveLength(1);
    expect(response.notifications[0]?.related_identity).toEqual(
      expect.objectContaining({
        handle: "alice",
        pfp: "alice-new.png",
        subscribed_actions: expect.arrayContaining([expect.any(String)]),
      })
    );
  });

  it("normalizes related wave on wave-created notifications", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      unread_count: 0,
      notifications: [
        {
          id: 8,
          cause: ApiNotificationCause.WaveCreated,
          created_at: 3000,
          read_at: null,
          related_identity: identity("creator"),
          related_wave: wave,
          related_drops: [],
          additional_context: {
            wave_id: "wave-1",
          },
        },
      ],
    });

    const response = await fetchNotificationsV2({ limit: "30" });
    const [notification] = response.notifications;

    expect(notification).toMatchObject({
      cause: ApiNotificationCause.WaveCreated,
      related_wave: {
        id: "wave-1",
        is_direct_message: true,
      },
      additional_context: {
        wave_id: "wave-1",
      },
    });
  });

  it("does not default all-drops vote context to reset rating", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      unread_count: 0,
      notifications: [
        {
          id: 11,
          cause: ApiNotificationCause.AllDrops,
          created_at: 5000,
          read_at: null,
          related_identity: identity("poster"),
          related_wave: wave,
          related_drops: [drop],
          additional_context: {},
        },
      ],
    });

    const response = await fetchNotificationsV2({ limit: "30" });
    const [notification] = response.notifications;

    expect(notification?.cause).toBe(ApiNotificationCause.AllDrops);
    expect(notification?.additional_context).toEqual({});
  });

  it("preserves identity rating rater totals in additional context", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      unread_count: 0,
      notifications: [
        {
          id: 12,
          cause: ApiNotificationCause.IdentityRep,
          created_at: 6000,
          read_at: null,
          related_identity: identity("rater"),
          related_drops: [],
          additional_context: {
            amount: 3,
            rater_rating: 5004,
            total: 5004,
            category: "phoeb",
          },
        },
        {
          id: 13,
          cause: ApiNotificationCause.IdentityNic,
          created_at: 7000,
          read_at: null,
          related_identity: identity("rater"),
          related_drops: [],
          additional_context: {
            amount: -2,
            rater_rating: 98,
            total: 120,
          },
        },
      ],
    });

    const response = await fetchNotificationsV2({ limit: "30" });

    expect(response.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cause: ApiNotificationCause.IdentityRep,
          additional_context: {
            amount: 3,
            rater_rating: 5004,
            total: 5004,
            category: "phoeb",
          },
        }),
        expect.objectContaining({
          cause: ApiNotificationCause.IdentityNic,
          additional_context: {
            amount: -2,
            rater_rating: 98,
            total: 120,
          },
        }),
      ])
    );
  });

  it("preserves drop voted rating change and total context", async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      unread_count: 0,
      notifications: [
        {
          id: 14,
          cause: ApiNotificationCause.DropVoted,
          created_at: 8000,
          read_at: null,
          related_identity: identity("voter"),
          related_wave: wave,
          related_drops: [drop],
          additional_context: {
            vote: 500,
            vote_change: -500,
            total_vote: 12345,
          },
        },
      ],
    });

    const response = await fetchNotificationsV2({ limit: "30" });

    expect(response.notifications[0]).toEqual(
      expect.objectContaining({
        cause: ApiNotificationCause.DropVoted,
        additional_context: {
          vote: 500,
          vote_change: -500,
          total_vote: 12345,
        },
      })
    );
  });

  it("drops unknown notification causes safely", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      (commonApiFetch as jest.Mock).mockResolvedValue({
        unread_count: 0,
        notifications: [
          {
            id: 9,
            cause: "NEW_CAUSE" as ApiNotificationCause,
            created_at: 4000,
            read_at: null,
            related_identity: identity("unknown"),
            related_drops: [],
            additional_context: {},
          },
        ],
      });

      const response = await fetchNotificationsV2({ limit: "30" });

      expect(response.notifications).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unsupported notification cause "NEW_CAUSE"')
      );
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
