import {
  computeRequiredChanges,
  hasOverdueChanges,
  isStrictRemoval,
  mayBeIdle,
  T_IDLE_MS,
  T_PCS_MS,
  type DeviceStatus,
  type RequiredChangesInput,
} from "@/lib/e2ee/engine/required-changes";

const NOW = 1_800_000_000_000;
const OWN = "0xown";

const ok = (expiresAt = NOW + 1e9): DeviceStatus => ({
  revoked: false,
  expiresAt,
  badGrant: false,
});

function input(
  overrides: Partial<RequiredChangesInput> = {}
): RequiredChangesInput {
  return {
    now: NOW,
    ownDeviceKey: OWN,
    ownProfileId: "me",
    members: [
      { deviceKey: OWN, profileId: "me" },
      { deviceKey: "0xb1", profileId: "bob" },
      { deviceKey: "0xc1", profileId: "carol" },
    ],
    leaving: new Set(),
    badGrants: new Set(),
    deviceStatus: new Map([
      [OWN, ok()],
      ["0xb1", ok()],
      ["0xc1", ok()],
    ]),
    activity: {
      [OWN]: { at: NOW, known: true },
      "0xb1": { at: NOW, known: true },
      "0xc1": { at: NOW, known: true },
    },
    lastSelfUpdateAt: NOW,
    selfUpdateRequested: false,
    activeDevices: new Map(),
    ...overrides,
  };
}

describe("required changes (contract 8.2, 8.4)", () => {
  it("is empty for a healthy group", () => {
    const changes = computeRequiredChanges(input());
    expect(changes).toEqual({
      strictRemovals: [],
      idleRemovals: [],
      ownAdds: [],
      otherAdds: [],
      selfUpdateDue: false,
    });
    expect(hasOverdueChanges(changes)).toBe(false);
  });

  it("treats revoked, expired, leaving and bad-grant leaves as STRICT", () => {
    const changes = computeRequiredChanges(
      input({
        members: [
          { deviceKey: OWN, profileId: "me" },
          { deviceKey: "0xb1", profileId: "bob" },
          { deviceKey: "0xc1", profileId: "carol" },
          { deviceKey: "0xd1", profileId: "dave" },
          { deviceKey: "0xe1", profileId: "erin" },
        ],
        leaving: new Set(["0xd1"]),
        badGrants: new Set(["0xe1"]),
        deviceStatus: new Map([
          ["0xb1", { revoked: true, expiresAt: NOW + 1e9, badGrant: false }],
          ["0xc1", ok(NOW)],
        ]),
      })
    );
    expect(changes.strictRemovals.sort()).toEqual([
      "0xb1",
      "0xc1",
      "0xd1",
      "0xe1",
    ]);
    expect(hasOverdueChanges(changes)).toBe(true);
  });

  it("never removes the own leaf", () => {
    const changes = computeRequiredChanges(
      input({
        deviceStatus: new Map([
          [OWN, { revoked: true, expiresAt: 0, badGrant: true }],
        ]),
      })
    );
    expect(changes.strictRemovals).toEqual([]);
  });

  it("flags idle leaves after 60 days", () => {
    const changes = computeRequiredChanges(
      input({
        activity: {
          [OWN]: { at: NOW - T_IDLE_MS - 1, known: true },
          "0xb1": { at: NOW - T_IDLE_MS - 1, known: false },
          "0xc1": { at: NOW - T_IDLE_MS + 1000, known: true },
        },
      })
    );
    expect(changes.idleRemovals).toEqual(["0xb1"]);
  });

  it("is lenient when judging someone else's idle removal", () => {
    expect(mayBeIdle(undefined, NOW)).toBe(true);
    expect(mayBeIdle({ at: NOW, known: false }, NOW)).toBe(true);
    expect(mayBeIdle({ at: NOW - 1000, known: true }, NOW)).toBe(false);
    expect(mayBeIdle({ at: NOW - T_IDLE_MS, known: true }, NOW)).toBe(true);
  });

  it("finds missing devices of member principals, own and others", () => {
    const changes = computeRequiredChanges(
      input({
        activeDevices: new Map([
          ["me", [OWN, "0xa2"]],
          ["bob", ["0xb1", "0xb2"]],
          ["carol", ["0xc1"]],
        ]),
      })
    );
    expect(changes.ownAdds).toEqual(["0xa2"]);
    expect(changes.otherAdds).toEqual([
      { profileId: "bob", deviceKey: "0xb2" },
    ]);
  });

  it("re-adds a principal's new device when its only leaf is revoked", () => {
    const changes = computeRequiredChanges(
      input({
        deviceStatus: new Map([
          ["0xb1", { revoked: true, expiresAt: NOW + 1e9, badGrant: false }],
        ]),
        activeDevices: new Map([["bob", ["0xb2"]]]),
      })
    );
    expect(changes.strictRemovals).toEqual(["0xb1"]);
    expect(changes.otherAdds).toEqual([
      { profileId: "bob", deviceKey: "0xb2" },
    ]);
  });

  it("does not add devices of a principal that is leaving", () => {
    const changes = computeRequiredChanges(
      input({
        leaving: new Set(["0xb1"]),
        activeDevices: new Map([["bob", ["0xb2"]]]),
      })
    );
    expect(changes.otherAdds).toEqual([]);
  });

  it("does not add devices that are themselves required removals", () => {
    const changes = computeRequiredChanges(
      input({
        activeDevices: new Map([["bob", ["0xb2"]]]),
        deviceStatus: new Map([
          ["0xb2", { revoked: false, expiresAt: NOW - 1, badGrant: false }],
        ]),
      })
    );
    expect(changes.otherAdds).toEqual([]);
  });

  it("schedules self-updates every 14 days or on request", () => {
    expect(
      computeRequiredChanges(input({ lastSelfUpdateAt: NOW - T_PCS_MS }))
        .selfUpdateDue
    ).toBe(true);
    expect(
      computeRequiredChanges(input({ lastSelfUpdateAt: NOW - T_PCS_MS + 1 }))
        .selfUpdateDue
    ).toBe(false);
    expect(
      computeRequiredChanges(input({ selfUpdateRequested: true })).selfUpdateDue
    ).toBe(true);
  });

  it("isStrictRemoval reads status, leaving and bad grants", () => {
    const base = {
      now: NOW,
      leaving: new Set<string>(),
      badGrants: new Set<string>(),
      deviceStatus: new Map(),
    };
    expect(isStrictRemoval("0xz", base)).toBe(false);
    expect(isStrictRemoval("0xz", { ...base, leaving: new Set(["0xz"]) })).toBe(
      true
    );
    expect(
      isStrictRemoval("0xz", {
        ...base,
        deviceStatus: new Map([
          ["0xz", { revoked: false, expiresAt: null, badGrant: true }],
        ]),
      })
    ).toBe(true);
  });
});
