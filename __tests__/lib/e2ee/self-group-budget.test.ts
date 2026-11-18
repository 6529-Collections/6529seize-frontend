/**
 * The self-group claim budget (P60 §2 rule 6): whatever devices are added,
 * removed or reordered by key, and however stale each device's listing, a
 * profile's self-group claims stay at 24 or fewer in every rolling hour.
 */
import {
  LISTING_FRESH_MS,
  SELF_GROUP_CLAIMS_PER_HOUR,
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
  listing: BudgetDevice[];
  listedAt: number;
  claims: number[];
  online: boolean;
}

/**
 * A profile over time: the server's device list, each device's own
 * listing (refreshed every 10 minutes, or on a device event after a delay)
 * and claims (as many as its share allows, whenever it looks).
 */
class Profile {
  readonly devices: BudgetDevice[] = [];
  readonly agents = new Map<string, Agent>();
  readonly claims: number[] = [];
  now = 0;

  add(key: string, at = this.now, settled = false): void {
    const addedAt = settled ? LONG_AGO : at;
    this.devices.push({
      key,
      addedAt,
      issuedAt: addedAt,
      revokedAt: null,
      expiresAt: 365 * DAY,
    });
    this.agents.set(key, {
      key,
      listing: [],
      listedAt: -Infinity,
      claims: [],
      online: true,
    });
    // A device lists its devices as it starts; the others on their own.
    this.list(key);
  }

  listAll(): void {
    for (const key of this.agents.keys()) this.list(key);
  }

  revoke(key: string): void {
    const device = this.devices.find((item) => item.key === key);
    if (device) device.revokedAt = this.now;
    this.agents.delete(key);
  }

  /** The device lists the profile's devices (GET /e2ee/me). */
  list(key: string): void {
    const agent = this.agents.get(key);
    if (!agent) return;
    agent.listing = this.devices
      .filter((device) => device.addedAt <= this.now)
      .map((device) => ({ ...device }));
    agent.listedAt = this.now;
  }

  share(key: string): number {
    const agent = this.agents.get(key);
    return agent
      ? selfGroupClaimShare({
          own: key,
          devices: agent.listing,
          now: this.now,
          listedAt: agent.listedAt,
        })
      : 0;
  }

  /** Claims as many as the device's share allows now. */
  claim(key: string, wanted = Infinity): number {
    const agent = this.agents.get(key);
    if (!agent?.online) return 0;
    let made = 0;
    while (made < wanted) {
      const recent = agent.claims.filter((at) => this.now - at < HOUR);
      if (recent.length >= this.share(key)) break;
      agent.claims.push(this.now);
      this.claims.push(this.now);
      made += 1;
    }
    return made;
  }

  /** Most claims of the profile in any rolling hour so far. */
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

describe("self-group claim budget (P60 §2 rule 6)", () => {
  it("gives the lowest settled key 24 - 2 per recent device, the others 2", () => {
    const profile = new Profile();
    profile.add("0x10", 0, true);
    profile.add("0x50", 0, true);
    profile.listAll();
    expect(profile.share("0x10")).toBe(20);
    expect(profile.share("0x50")).toBe(2);
    profile.add("0x90", 0, true);
    profile.list("0x10");
    expect(profile.share("0x10")).toBe(18);
  });

  it("makes no claim without a listing from the last 15 minutes", () => {
    const profile = new Profile();
    profile.add("0x10", 0, true);
    profile.now = LISTING_FRESH_MS + 1;
    expect(profile.share("0x10")).toBe(0);
    profile.list("0x10");
    expect(profile.share("0x10")).toBe(22);
  });

  it("keeps prxt's sequence within 24: 20 spent, then a device added, then a third", () => {
    const profile = new Profile();
    profile.add("0x10", 0, true);
    profile.add("0x50", 0, true);
    profile.listAll();
    // The lowest key spends its share; the other device its own.
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
    for (const key of profile.agents.keys()) profile.claim(key);
    expect(profile.worstHour()).toBe(SELF_GROUP_CLAIMS_PER_HOUR);
    // The newest device takes the lowest key's share once settled, after
    // the first device's spending has left the hour.
    profile.now = 86 * MINUTE;
    for (const key of profile.agents.keys()) profile.list(key);
    expect(profile.share("0x01")).toBe(SELF_GROUP_CLAIMS_PER_HOUR - 2 * 4);
    for (const key of profile.agents.keys()) profile.claim(key);
    expect(profile.worstHour()).toBeLessThanOrEqual(SELF_GROUP_CLAIMS_PER_HOUR);
  });

  it("promotes the next key only 75 minutes after the lowest one is removed", () => {
    const profile = new Profile();
    profile.add("0x10", 0, true);
    profile.add("0x50", 0, true);
    profile.add("0x90", 0, true);
    profile.listAll();
    expect(profile.claim("0x10")).toBe(18);
    profile.now = MINUTE;
    profile.revoke("0x10");
    for (const key of profile.agents.keys()) profile.list(key);
    // The removed device still counts among the recent ones.
    expect(profile.share("0x50")).toBe(2);
    profile.now = 30 * MINUTE;
    for (const key of profile.agents.keys()) {
      profile.list(key);
      profile.claim(key);
    }
    expect(profile.worstHour()).toBeLessThanOrEqual(SELF_GROUP_CLAIMS_PER_HOUR);
    profile.now = 77 * MINUTE;
    for (const key of profile.agents.keys()) profile.list(key);
    expect(profile.share("0x50")).toBe(SELF_GROUP_CLAIMS_PER_HOUR - 2 * 2);
    for (const key of profile.agents.keys()) profile.claim(key);
    expect(profile.worstHour()).toBeLessThanOrEqual(SELF_GROUP_CLAIMS_PER_HOUR);
  });

  it.each(Array.from({ length: 60 }, (_, index) => index + 1))(
    "never exceeds 24 in any rolling hour while devices come and go (seed %i)",
    (seed) => {
      const next = random(seed);
      const profile = new Profile();
      const initial = 1 + Math.floor(next() * 5);
      for (let index = 0; index < initial; index += 1) {
        profile.add(hexKey(next), 0, next() < 0.8);
      }
      profile.listAll();
      /** Listings refresh every 10 minutes and after device events. */
      const due = new Map<string, number>();
      const refreshSoon = () => {
        for (const key of profile.agents.keys()) {
          due.set(
            key,
            Math.min(
              due.get(key) ?? Infinity,
              profile.now + Math.floor(next() * 10) * MINUTE
            )
          );
        }
      };
      for (let minute = 0; minute < 8 * 60; minute += 1) {
        profile.now = minute * MINUTE;
        const roll = next();
        if (roll < 0.03 && profile.agents.size < 10) {
          profile.add(hexKey(next));
          refreshSoon();
        } else if (roll < 0.05 && profile.agents.size > 1) {
          const keys = [...profile.agents.keys()];
          profile.revoke(keys[Math.floor(next() * keys.length)] ?? "");
          refreshSoon();
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
          if (
            profile.now - agent.listedAt >= 10 * MINUTE ||
            (due.get(agent.key) ?? Infinity) <= profile.now
          ) {
            profile.list(agent.key);
            due.delete(agent.key);
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
