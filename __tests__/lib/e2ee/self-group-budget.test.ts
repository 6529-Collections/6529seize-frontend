/**
 * The self-group claim budget (P60 §2 rule 6): whatever devices are added,
 * removed or reordered by key, however stale each device's listing (up to
 * the 15 minutes allowed) and however far its clock is from the server's
 * (up to the 5 minutes assumed), a profile's self-group claims stay at 24
 * or fewer in every rolling hour of real time.
 */
import {
  CLAIM_LOG_WINDOW_MS,
  LISTING_FRESH_MS,
  SELF_GROUP_CLAIMS_PER_HOUR,
  SKEW_MS,
  selfGroupClaimShare,
  type BudgetDevice,
} from "@/lib/e2ee/engine/self-group-budget";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const LONG_AGO = -30 * DAY;

/** One device's view and spending, as its engine keeps them. */
interface Agent {
  key: string;
  /** Its clock minus real (server) time; may change between listings. */
  offset: number;
  listing: BudgetDevice[];
  /** Its clock, and real time, when it listed. */
  listedWall: number;
  listedReal: number;
  /** Claim stamps by the budget's clock, as the engine records them. */
  claims: number[];
  online: boolean;
}

/**
 * A profile over real time: the server's device list, and each device's
 * listing, clock and claims (as many as its share allows when it looks).
 */
class Profile {
  readonly devices: BudgetDevice[] = [];
  readonly agents = new Map<string, Agent>();
  /** Real times of every claim. */
  readonly claims: number[] = [];
  now = 0;

  add(
    key: string,
    options: {
      at?: number;
      settled?: boolean;
      offset?: number;
      issuedEarlier?: number;
    } = {}
  ): void {
    const offset = options.offset ?? 0;
    const addedAt =
      options.settled === true ? LONG_AGO : (options.at ?? this.now);
    this.devices.push({
      key,
      addedAt,
      // The grant is signed by the device's own clock before it registers.
      issuedAt: addedAt + offset - (options.issuedEarlier ?? 0),
      revokedAt: null,
      expiresAt: 365 * DAY,
    });
    this.agents.set(key, {
      key,
      offset,
      listing: [],
      listedWall: -Infinity,
      listedReal: -Infinity,
      claims: [],
      online: true,
    });
    // A device lists its devices as it starts; the others on their own.
    this.list(key);
  }

  revoke(key: string): void {
    const device = this.devices.find((item) => item.key === key);
    if (device) device.revokedAt = this.now;
    this.agents.delete(key);
  }

  /** The device lists the profile's devices (GET /e2ee/me). */
  list(key: string, offset?: number): void {
    const agent = this.agents.get(key);
    if (!agent) return;
    if (offset !== undefined) agent.offset = offset;
    agent.listing = this.devices
      .filter((device) => device.addedAt <= this.now)
      .map((device) => ({ ...device }));
    agent.listedWall = this.now + agent.offset;
    agent.listedReal = this.now;
  }

  listAll(): void {
    for (const key of this.agents.keys()) this.list(key);
  }

  /** The budget's clock: the clock at listing plus monotonic time since. */
  clock(agent: Agent): { now: number; listingAge: number } {
    const listingAge = this.now - agent.listedReal;
    return { now: agent.listedWall + listingAge, listingAge };
  }

  share(key: string): number {
    const agent = this.agents.get(key);
    return agent
      ? selfGroupClaimShare({
          own: key,
          devices: agent.listing,
          ...this.clock(agent),
        })
      : 0;
  }

  /** Claims as many as the device's share allows now. */
  claim(key: string, wanted = Infinity): number {
    const agent = this.agents.get(key);
    if (!agent?.online) return 0;
    const { now } = this.clock(agent);
    let made = 0;
    while (made < wanted) {
      const recent = agent.claims
        .map((at) => Math.min(at, now))
        .filter((at) => now - at < CLAIM_LOG_WINDOW_MS);
      if (recent.length >= this.share(key)) break;
      agent.claims.push(now);
      this.claims.push(this.now);
      made += 1;
    }
    return made;
  }

  claimAll(): void {
    for (const key of this.agents.keys()) this.claim(key);
  }

  /** Most claims of the profile in any rolling hour of real time so far. */
  worstHour(): number {
    const sorted = [...this.claims].sort((a, b) => a - b);
    let worst = 0;
    let start = 0;
    for (let end = 0; end < sorted.length; end += 1) {
      while ((sorted[end] ?? 0) - (sorted[start] ?? 0) >= HOUR) start += 1;
      worst = Math.max(worst, end - start + 1);
    }
    return worst;
  }
}

/** Deterministic pseudo-random numbers (mulberry32). */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexKey = (next: () => number): string =>
  `0x${Math.floor(next() * 0xffffffff)
    .toString(16)
    .padStart(8, "0")}`;

/**
 * prxt's timing case (FTR drop feffa9bd): the lowest key spends its share
 * on a listing 14½ minutes old; just after that listing a device with a
 * lower key is added whose clock is `fast` ahead and whose grant was issued
 * before the server added it. Steps a minute at a time for three hours.
 */
function staleListingAndFastClock(fast: number) {
  const profile = new Profile();
  profile.add("0x10", { settled: true });
  profile.add("0x50", { settled: true });
  profile.listAll();
  // Just after those listings, a device with a lower key is added.
  profile.now = 0.5 * MINUTE;
  // Its grant was signed (by its fast clock) before the server added it,
  // so the server's time is the later one and its clock alone sets when
  // it settles.
  profile.add("0x05", { offset: fast, issuedEarlier: fast + 2 * MINUTE });
  // The first device spends its share on its listing, now 14½ minutes old.
  profile.now = 14.5 * MINUTE;
  profile.claimAll();
  let firstLowest = Infinity;
  for (let minute = 15; minute <= 180; minute += 1) {
    profile.now = minute * MINUTE;
    profile.listAll();
    const made = profile.claim("0x05");
    if (made > 2 && firstLowest === Infinity) firstLowest = profile.now;
    profile.claim("0x50");
    profile.claim("0x10");
  }
  return { profile, firstLowest };
}

describe("self-group claim budget (P60 §2 rule 6)", () => {
  it("gives the lowest settled key 24 - 2 per recent device, the others 2", () => {
    const profile = new Profile();
    profile.add("0x10", { settled: true });
    profile.add("0x50", { settled: true });
    profile.listAll();
    expect(profile.share("0x10")).toBe(20);
    expect(profile.share("0x50")).toBe(2);
    profile.add("0x90", { settled: true });
    profile.list("0x10");
    expect(profile.share("0x10")).toBe(18);
  });

  it("makes no claim without a listing from the last 15 minutes", () => {
    const profile = new Profile();
    profile.add("0x10", { settled: true });
    profile.now = LISTING_FRESH_MS + 1;
    expect(profile.share("0x10")).toBe(0);
    profile.list("0x10");
    expect(profile.share("0x10")).toBe(22);
  });

  it("makes no claim while its clock is behind the server's by more than the bound", () => {
    const profile = new Profile();
    profile.add("0x10", { settled: true });
    profile.add("0x50", { at: 0 });
    profile.now = 2 * HOUR;
    // The listing shows the second device added at 0; a clock 6 minutes
    // behind still reads after that, but one 3 hours behind does not.
    profile.list("0x10", -(SKEW_MS + MINUTE));
    expect(profile.share("0x10")).toBe(20);
    profile.list("0x10", -3 * HOUR);
    expect(profile.share("0x10")).toBe(0);
  });

  it("keeps prxt's sequence within 24: 20 spent, then a device added, then a third", () => {
    const profile = new Profile();
    profile.add("0x10", { settled: true });
    profile.add("0x50", { settled: true });
    profile.listAll();
    expect(profile.claim("0x10")).toBe(20);
    expect(profile.claim("0x50")).toBe(2);
    // A device with an even lower key is added: it is new, so it may make
    // 2, not the lowest key's share.
    profile.now = 5 * MINUTE;
    profile.add("0x05");
    expect(profile.share("0x05")).toBe(2);
    expect(profile.claim("0x05")).toBe(2);
    // The first device no longer has the lowest key once it lists again.
    profile.list("0x10");
    expect(profile.share("0x10")).toBe(2);
    expect(profile.claim("0x10")).toBe(0);
    // A third device, added shortly after the second, may make none yet.
    profile.now = 10 * MINUTE;
    profile.add("0x01");
    expect(profile.share("0x01")).toBe(0);
    profile.claimAll();
    expect(profile.worstHour()).toBe(SELF_GROUP_CLAIMS_PER_HOUR);
    // The newest device takes the lowest key's share once settled (95
    // minutes after it was added), after the first device's 20 have left.
    profile.now = 106 * MINUTE;
    profile.listAll();
    expect(profile.share("0x01")).toBe(SELF_GROUP_CLAIMS_PER_HOUR - 2 * 4);
    profile.claimAll();
    expect(profile.worstHour()).toBeLessThanOrEqual(SELF_GROUP_CLAIMS_PER_HOUR);
  });

  it("promotes the next key only 95 minutes after the lowest one is removed", () => {
    const profile = new Profile();
    profile.add("0x10", { settled: true });
    profile.add("0x50", { settled: true });
    profile.add("0x90", { settled: true });
    profile.listAll();
    expect(profile.claim("0x10")).toBe(18);
    profile.now = MINUTE;
    profile.revoke("0x10");
    profile.listAll();
    // The removed device still counts among the recent ones.
    expect(profile.share("0x50")).toBe(2);
    profile.now = 90 * MINUTE;
    profile.listAll();
    profile.claimAll();
    expect(profile.share("0x50")).toBe(2);
    profile.now = 97 * MINUTE;
    profile.listAll();
    expect(profile.share("0x50")).toBe(SELF_GROUP_CLAIMS_PER_HOUR - 2 * 2);
    profile.claimAll();
    expect(profile.worstHour()).toBeLessThanOrEqual(SELF_GROUP_CLAIMS_PER_HOUR);
  });

  it("stays within 24 with a listing 14½ minutes old and a new device's clock 1 minute fast (prxt)", () => {
    const { profile, firstLowest } = staleListingAndFastClock(MINUTE);
    expect(profile.worstHour()).toBeLessThanOrEqual(SELF_GROUP_CLAIMS_PER_HOUR);
    // The new device takes the lowest key's share more than an hour after
    // the first device's last claim with it.
    expect(firstLowest - 14.5 * MINUTE).toBeGreaterThanOrEqual(HOUR);
  });

  it("documents the bound: a clock far enough past it lets two lowest-key shares meet", () => {
    // Within the 5-minute bound, and up to 21 minutes in this case (the
    // 90-minute settle leaves slack), the hour holds.
    for (const fast of [SKEW_MS, 21 * MINUTE]) {
      const { profile } = staleListingAndFastClock(fast);
      expect(profile.worstHour()).toBeLessThanOrEqual(
        SELF_GROUP_CLAIMS_PER_HOUR
      );
    }
    // A clock 25 minutes fast settles the new device 25 minutes early: its
    // lowest-key share lands in the same hour as the first device's.
    const { profile } = staleListingAndFastClock(25 * MINUTE);
    expect(profile.worstHour()).toBeGreaterThan(SELF_GROUP_CLAIMS_PER_HOUR);
  });

  it.each(Array.from({ length: 60 }, (_, index) => index + 1))(
    "never exceeds 24 in any rolling hour of real time while devices come and go, listings age and clocks drift (seed %i)",
    (seed) => {
      const next = random(seed);
      const skew = () => Math.round((next() * 2 - 1) * SKEW_MS);
      const profile = new Profile();
      const initial = 1 + Math.floor(next() * 5);
      for (let index = 0; index < initial; index += 1) {
        profile.add(hexKey(next), {
          at: 0,
          settled: next() < 0.8,
          offset: skew(),
          issuedEarlier: Math.floor(next() * 3) * MINUTE,
        });
      }
      profile.listAll();
      /** Each device lists every 10 to 15 minutes, or sooner on events. */
      const due = new Map<string, number>();
      const schedule = (key: string, within: number) =>
        due.set(
          key,
          Math.min(
            due.get(key) ?? Infinity,
            profile.now + Math.floor(next() * within)
          )
        );
      for (const key of profile.agents.keys()) schedule(key, 15 * MINUTE);
      for (let minute = 0; minute < 8 * 60; minute += 1) {
        profile.now = minute * MINUTE;
        const roll = next();
        if (roll < 0.03 && profile.agents.size < 10) {
          const key = hexKey(next);
          profile.add(key, {
            offset: skew(),
            issuedEarlier: Math.floor(next() * 3) * MINUTE,
          });
          for (const other of profile.agents.keys()) {
            schedule(other, 15 * MINUTE);
          }
        } else if (roll < 0.05 && profile.agents.size > 1) {
          const keys = [...profile.agents.keys()];
          profile.revoke(keys[Math.floor(next() * keys.length)] ?? "");
        } else if (roll < 0.08 && profile.agents.size > 0) {
          const keys = [...profile.agents.keys()];
          const agent = profile.agents.get(
            keys[Math.floor(next() * keys.length)] ?? ""
          );
          if (agent) {
            agent.online = !agent.online;
            // A device coming back lists its devices as it starts.
            if (agent.online) due.set(agent.key, profile.now);
          }
        }
        for (const agent of profile.agents.values()) {
          if (!agent.online) continue;
          if ((due.get(agent.key) ?? Infinity) <= profile.now) {
            // Its clock may have drifted or been set within the bound.
            profile.list(agent.key, skew());
            due.delete(agent.key);
            schedule(agent.key, 15 * MINUTE + 1);
          }
          profile.claim(agent.key, 1 + Math.floor(next() * 6));
        }
        expect(profile.worstHour()).toBeLessThanOrEqual(
          SELF_GROUP_CLAIMS_PER_HOUR
        );
      }
      expect(profile.claims.length).toBeGreaterThan(0);
    }
  );
});
