import { getActiveWaveVoteDeadlineLabel } from "@/components/waves/discovery/active-wave-vote.helpers";
import type { ApiActiveWaveVote } from "@/generated/models/ApiActiveWaveVote";
import { LOCAL_DISPLAY_TIME_ZONE } from "@/lib/display-time-zone/displayTimeZone";
import { mockDefaultTimeZone } from "../../../utils/timeZoneHydration";

// 23:59 UTC on Jan 1 is 03:59 on Jan 2 in Dubai (UTC+4).
const DEADLINE = Date.UTC(2026, 0, 1, 23, 59);

const vote = (end: number | null, decision: number | null): ApiActiveWaveVote =>
  ({
    wave: { id: "w", name: "Wave" },
    voting_ends_at: end,
    next_decision_at: decision,
  }) as ApiActiveWaveVote;

describe("getActiveWaveVoteDeadlineLabel", () => {
  it("keeps the device-zone label unchanged when the zone is local", () => {
    const restoreUtc = mockDefaultTimeZone("UTC");
    try {
      expect(
        getActiveWaveVoteDeadlineLabel(vote(DEADLINE, null), "en-US")
      ).toMatch(/^Voting ends Jan 1, 11:59\sPM$/);
      expect(
        getActiveWaveVoteDeadlineLabel(
          vote(DEADLINE, null),
          "en-US",
          LOCAL_DISPLAY_TIME_ZONE
        )
      ).toMatch(/^Voting ends Jan 1, 11:59\sPM$/);
    } finally {
      restoreUtc();
    }

    const restore = mockDefaultTimeZone("America/Los_Angeles");
    try {
      expect(
        getActiveWaveVoteDeadlineLabel(
          vote(null, DEADLINE),
          "en-US",
          LOCAL_DISPLAY_TIME_ZONE
        )
      ).toMatch(/^Next result Jan 1, 3:59\sPM$/);
    } finally {
      restore();
    }
  });

  it("names UTC when the display zone is UTC", () => {
    const restore = mockDefaultTimeZone("Asia/Dubai");
    try {
      expect(
        getActiveWaveVoteDeadlineLabel(vote(DEADLINE, null), "en-US", {
          timeZone: "UTC",
          isLocal: false,
        })
      ).toMatch(/^Voting ends Jan 1, 11:59\sPM UTC$/);
    } finally {
      restore();
    }
  });

  it("flips the day at the display zone's midnight", () => {
    expect(
      getActiveWaveVoteDeadlineLabel(vote(null, DEADLINE), "en-US", {
        timeZone: "Asia/Dubai",
        isLocal: false,
      })
    ).toMatch(/^Next result Jan 2, 3:59\sAM GMT\+4$/);
  });

  it("still reports an open vote without a deadline", () => {
    expect(
      getActiveWaveVoteDeadlineLabel(vote(null, null), "en-US", {
        timeZone: "UTC",
        isLocal: false,
      })
    ).toBe("Voting open");
  });
});
