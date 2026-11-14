import type { ApiNotification } from "@/generated/models/ApiNotification";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import {
  buildDesktopNotification,
  getDesktopDropPreviewText,
} from "@/helpers/desktop-notification-text";

const emoji = {
  findNativeEmoji: (id: string) =>
    id === "fire" ? { skins: [{ native: "🔥" }] } : null,
  findCustomEmoji: (id: string) =>
    id === "gm" ? { skins: [{ src: "https://cdn.example/gm.png" }] } : null,
};

const drop = (overrides: Record<string, unknown> = {}) => ({
  serial_no: 42,
  wave: { id: "wave-1", name: "Memes", admin_group_id: null },
  parts: [{ content: "Hello **world** :fire:", media: [], attachments: [] }],
  ...overrides,
});

const notification = (
  cause: ApiNotificationCause,
  overrides: Partial<Record<keyof ApiNotification, unknown>> = {}
): ApiNotification =>
  ({
    id: 7,
    cause,
    created_at: 0,
    read_at: null,
    related_identity: { handle: "punk6529", pfp: "ipfs://pfp" },
    related_drops: [drop()],
    additional_context: {},
    ...overrides,
  }) as unknown as ApiNotification;

const build = (value: ApiNotification, handle: string | null = "me") =>
  buildDesktopNotification(value, emoji, "en-US", handle);

describe("buildDesktopNotification", () => {
  it("describes a follow and opens the follower's profile", () => {
    expect(
      build(notification(ApiNotificationCause.IdentitySubscribed))
    ).toEqual({
      title: "punk6529 is now following you",
      body: "View profile",
      redirectPath: "/punk6529",
    });
  });

  it("shows a mention with the drop's plain text and opens the drop", () => {
    expect(build(notification(ApiNotificationCause.IdentityMentioned))).toEqual(
      {
        title: "punk6529 mentioned you",
        body: "Hello world 🔥",
        redirectPath: "/waves/wave-1?serialNo=42",
      }
    );
  });

  it("opens direct-message drops in messages", () => {
    const result = build(
      notification(ApiNotificationCause.DropQuoted, {
        related_drops: [
          drop({ wave: { id: "dm", name: "DM", is_direct_message: true } }),
        ],
      })
    );
    expect(result?.redirectPath).toBe("/messages/dm?serialNo=42");
  });

  it("shows the reply, not the replied-to drop", () => {
    const result = build(
      notification(ApiNotificationCause.DropReplied, {
        related_drops: [
          drop(),
          drop({
            serial_no: 43,
            parts: [{ content: "The reply", media: [], attachments: [] }],
          }),
        ],
      })
    );
    expect(result).toMatchObject({
      title: "punk6529 replied",
      body: "The reply",
      redirectPath: "/waves/wave-1?serialNo=43",
    });
  });

  it("formats REP changes with signs and the category", () => {
    const result = build(
      notification(ApiNotificationCause.IdentityRep, {
        additional_context: { amount: 1500, total: 20000, category: "Art" },
      })
    );
    expect(result).toEqual({
      title: "🚀 Updated REP for “Art”",
      body: "punk6529 updated your REP by +1,500\nNew total: 20,000",
      redirectPath: "/me",
    });
  });

  it("formats a NIC decrease", () => {
    const result = build(
      notification(ApiNotificationCause.IdentityNic, {
        additional_context: { amount: -5, total: 10 },
      }),
      null
    );
    expect(result).toEqual({
      title: "💔 Updated NIC rating",
      body: "punk6529 updated your NIC by -5\nNew total: 10",
      redirectPath: "/notifications",
    });
  });

  it("skips zero votes and reactions without a value", () => {
    expect(
      build(
        notification(ApiNotificationCause.DropVoted, {
          additional_context: { vote: 0 },
        })
      )
    ).toBeNull();
    expect(build(notification(ApiNotificationCause.DropReacted))).toBeNull();
  });

  it("shows a vote with its sign", () => {
    expect(
      build(
        notification(ApiNotificationCause.DropVoted, {
          additional_context: { vote: -3 },
        })
      )?.title
    ).toBe("punk6529 rated -3");
  });

  it("uses a custom reaction's image as the icon", () => {
    expect(
      build(
        notification(ApiNotificationCause.DropReacted, {
          additional_context: { reaction: ":gm:" },
        })
      )
    ).toMatchObject({
      title: "punk6529 reacted",
      iconUrl: "https://cdn.example/gm.png",
    });
    expect(
      build(
        notification(ApiNotificationCause.DropReacted, {
          additional_context: { reaction: ":fire:" },
        })
      )?.title
    ).toBe("punk6529 reacted 🔥");
  });

  it("names a reaction it cannot show as an emoji", () => {
    expect(
      build(
        notification(ApiNotificationCause.DropReacted, {
          additional_context: { reaction: ":party_parrot:" },
        })
      )?.title
    ).toBe("punk6529 reacted “party parrot”");
  });

  it("never announces an encrypted message (the chat code does, without the sender)", () => {
    expect(build(notification(ApiNotificationCause.E2EeMessage))).toBeNull();
  });

  it("falls back to a generic notification", () => {
    expect(
      build(
        notification(ApiNotificationCause.PriorityAlert, {
          related_identity: null,
        })
      )
    ).toEqual({
      title: "You have a new notification from Someone",
      body: "View notification",
      redirectPath: "/notifications",
    });
  });

  it("turns mentions into plain text", () => {
    expect(
      build(
        notification(ApiNotificationCause.IdentityMentioned, {
          related_drops: [
            drop({
              parts: [
                { content: "hi @[simo] see", media: [], attachments: [] },
              ],
            }),
          ],
        })
      )?.body
    ).toBe("hi @simo see");
  });
});

describe("getDesktopDropPreviewText", () => {
  it("drops media links from the text", () => {
    expect(
      getDesktopDropPreviewText(
        {
          parts: [
            {
              content: "look https://cdn.example/a.png here",
              media: [],
              attachments: [],
            },
          ],
        } as never,
        "en-US"
      )?.text
    ).not.toContain("a.png");
  });

  it("lists attachments, then labels media, literally", () => {
    expect(
      getDesktopDropPreviewText(
        {
          parts: [
            {
              content: "",
              media: [],
              attachments: [{ file_name: "notes.pdf" }],
            },
          ],
        } as never,
        "en-US"
      )
    ).toEqual({ text: "notes.pdf", literal: true });
    expect(
      getDesktopDropPreviewText(
        {
          parts: [
            {
              content: null,
              media: [{ mime_type: "image/png" }],
              attachments: [],
            },
          ],
        } as never,
        "en-US"
      )
    ).toEqual({ text: "Media attachment", literal: true });
  });

  it("skips content longer than one API drop part", () => {
    expect(
      getDesktopDropPreviewText(
        {
          parts: [{ content: "x".repeat(25_001), media: [], attachments: [] }],
        } as never,
        "en-US"
      )
    ).toBeNull();
  });
});
