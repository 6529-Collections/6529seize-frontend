import {
  getInboxDestination,
  getInboxDrop,
  getInboxSummary,
} from "@/components/notifications/inbox/notificationInbox.helpers";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type {
  INotificationArtistArtwork,
  INotificationDropReplied,
  INotificationIdentitySubscribed,
  INotificationVotingCreditsReturned,
} from "@/types/feed.types";

const actor = { handle: "alice", is_anonymous: false } as ApiProfileMin;
const base = { id: 1, created_at: 1000, read_at: null };
const original = {
  id: "original",
  serial_no: 42,
  wave: { id: "public-wave", is_direct_message: false },
} as ApiDrop;
const reply = {
  id: "reply",
  serial_no: 43,
  wave: { id: "private-wave", is_direct_message: true },
} as ApiDrop;
const replied: INotificationDropReplied = {
  ...base,
  cause: ApiNotificationCause.DropReplied,
  related_identity: actor,
  related_drops: [original, reply],
  additional_context: {
    reply_drop_id: "reply",
    replied_drop_id: "original",
    replied_drop_part: "1",
  },
};

const artwork: INotificationArtistArtwork = {
  ...base,
  cause: ApiNotificationCause.ArtistArtworkSubmitted,
  related_identity: actor,
  related_drops: [original],
  additional_context: {
    artist_id: "artist",
    drop_id: original.id,
    wave_id: "public-wave",
    competition_id: "competition",
    entry_id: "entry",
    competition_title: "The Memes Main Stage",
    artwork_title: "  Open skies  ",
    submitted_at: 1000,
  },
};

it("names artwork alerts and opens their exact entry even with a related drop", () => {
  expect(getInboxSummary(artwork, "en-US")).toBe(
    "alice submitted Open skies to The Memes Main Stage."
  );
  expect(getInboxDestination(artwork, "viewer")).toBe(
    "/waves/public-wave/competitions/competition?entry=entry"
  );
});

it.each([null, "   "])("handles an untitled artwork (%s)", (title) => {
  expect(
    getInboxSummary(
      {
        ...artwork,
        additional_context: {
          ...artwork.additional_context,
          artwork_title: title,
        },
      },
      "en-US"
    )
  ).toBe("alice submitted untitled artwork to The Memes Main Stage.");
});

it("opens the reply itself in its DM rather than the original drop", () => {
  expect(getInboxDrop(replied)).toBe(reply);
  expect(getInboxDestination(replied, "viewer")).toBe(
    "/messages/private-wave?serialNo=43"
  );
  expect(getInboxDrop({ ...replied, related_drops: [reply, original] })).toBe(
    reply
  );
});

it("opens a quote and public mention at their serial number", () => {
  expect(
    getInboxDestination(
      {
        ...replied,
        cause: ApiNotificationCause.DropQuoted,
        additional_context: {
          quote_drop_id: "original",
          quote_drop_part: "1",
          quoted_drop_id: "reply",
          quoted_drop_part: "1",
        },
      },
      "viewer"
    )
  ).toBe("/waves/public-wave?serialNo=42");
  expect(
    getInboxDestination(
      {
        ...base,
        cause: ApiNotificationCause.IdentityMentioned,
        related_identity: actor,
        related_drops: [original],
      },
      "viewer"
    )
  ).toBe("/waves/public-wave?serialNo=42");
});

it("falls back safely when the related reply is unavailable", () => {
  expect(getInboxDestination({ ...replied, related_drops: [] }, "viewer")).toBe(
    "/notifications"
  );
  expect(
    getInboxDestination({ ...replied, related_drops: [original] }, "viewer")
  ).toBe("/waves/public-wave?serialNo=42");
});

it("does not expose an anonymous actor's handle in copy or profile links", () => {
  const notification: INotificationIdentitySubscribed = {
    ...base,
    cause: ApiNotificationCause.IdentitySubscribed,
    related_identity: { ...actor, is_anonymous: true },
  };
  expect(getInboxSummary(notification, "en-US")).toBe(
    "Anonymous started following you"
  );
  expect(getInboxDestination(notification, "viewer")).toBe("/notifications");
});

it("sends REP and NIC updates to the recipient rather than the actor", () => {
  const rating = {
    ...base,
    related_identity: actor,
    additional_context: { amount: -100, total: 100, category: "Art" },
  };
  expect(
    getInboxDestination(
      { ...rating, cause: ApiNotificationCause.IdentityRep },
      "viewer"
    )
  ).toBe("/viewer/rep");
  expect(
    getInboxDestination(
      { ...rating, cause: ApiNotificationCause.IdentityNic },
      "viewer"
    )
  ).toBe("/viewer/nic");
  expect(
    getInboxDestination(
      { ...rating, cause: ApiNotificationCause.IdentityRep },
      ""
    )
  ).toBe("/notifications");
  expect(
    getInboxDestination(
      { ...rating, cause: ApiNotificationCause.IdentityNic },
      ""
    )
  ).toBe("/notifications");
  expect(
    getInboxSummary(
      { ...rating, cause: ApiNotificationCause.IdentityRep },
      "en-US"
    )
  ).toBe("alice updated your REP by -100");
});

const credits: INotificationVotingCreditsReturned = {
  ...base,
  cause: ApiNotificationCause.VotingCreditsReturned,
  additional_context: {
    event_id: "event",
    reason: "WIN",
    wave_id: "wave",
    competition_id: "competition",
    competition_title: "Art competition",
    entry_id: "entry",
    drop_id: "drop",
    submission_title: "Artwork",
    credit_type: "TDH",
    amount: 1500,
    released_at: 1000,
  },
};

it("keeps missing-context priority summaries readable", () => {
  expect(
    getInboxSummary(
      {
        ...base,
        cause: ApiNotificationCause.PriorityAlert,
        related_identity: actor,
        related_drops: [],
        additional_context: {},
      },
      "en-US"
    )
  ).toBe("Priority alert");
});

it("links deleted entries to their surviving competition and formats returned credits", () => {
  expect(getInboxDestination(credits, "viewer")).toBe(
    "/waves/wave/competitions/competition?entry=entry"
  );
  expect(
    getInboxDestination(
      {
        ...credits,
        additional_context: {
          ...credits.additional_context,
          reason: "AUTHOR_DELETED",
        },
      },
      "viewer"
    )
  ).toBe("/waves/wave/competitions/competition");
  expect(getInboxSummary(credits, "en-US")).toBe(
    "1,500 voting credits returned in Art competition"
  );
});
