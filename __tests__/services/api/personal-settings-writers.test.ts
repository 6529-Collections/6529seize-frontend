import type { PersonalChange } from "@/lib/personal-records/personal-record-changes";
import type { PersonalRecordsMode } from "@/lib/personal-records/personal-records-mode";

jest.mock("@/lib/personal-records/personal-records-flag", () => ({
  isPersonalRecordsEnabled: () => true,
}));
const mockGetMode = jest.fn<Promise<PersonalRecordsMode>, unknown[]>();
jest.mock("@/lib/personal-records/personal-records-mode", () => ({
  getPersonalRecordsMode: (...args: unknown[]) => mockGetMode(...args),
}));

const mockSubmit = jest.fn();
jest.mock("@/lib/personal-records/personal-records-submit", () => ({
  // The change may come as a builder, run in the owner's queue.
  submitPersonalChange: async (change: unknown, ...rest: unknown[]) =>
    mockSubmit(typeof change === "function" ? await change() : change, ...rest),
}));

// Owners are looked up by handle, wallet or profile id; fixed fakes here.
const OWNER = {
  alice: `0x${"a1".repeat(32)}`,
  artist: `0x${"a2".repeat(32)}`,
  "profile-b": `0x${"b1".repeat(32)}`,
  "profile-1": `0x${"c1".repeat(32)}`,
  "profile-2": "0x0000000000000000000000000000000000000002",
} as const;
const ownerOf = (key: string) => {
  const owner = (OWNER as Record<string, string>)[key];
  if (!owner) throw new Error(`no owner for ${key}`);
  return owner;
};
jest.mock("@/lib/personal-records/record-owners", () => ({
  ownerOfProfile: async (key: string) => ownerOf(key),
  ownersOfProfiles: async (keys: readonly string[]) => keys.map(ownerOf),
}));

jest.mock("@/components/device-signing/deviceSetup", () => ({
  openDeviceSetup: jest.fn(),
}));

jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
  commonApiPut: jest.fn(),
  commonApiDelete: jest.fn(),
  commonApiDeleteWithBody: jest.fn(),
  commonApiDeleteWithResponse: jest.fn(),
  commonApiPostWithoutBodyAndResponse: jest.fn(),
}));
// Some services import "./common-api"; that path must get the same mocks.
jest.mock("../../../services/api/common-api", () =>
  jest.requireMock("@/services/api/common-api")
);

import {
  commonApiDelete,
  commonApiDeleteWithBody,
  commonApiDeleteWithResponse,
  commonApiFetch,
  commonApiPost,
  commonApiPostWithoutBodyAndResponse,
  commonApiPut,
} from "@/services/api/common-api";
import { setArtworkAlert } from "@/services/api/artwork-alerts-api";
import {
  blockProfile,
  hideDrop,
  unblockProfile,
  unhideDrop,
} from "@/services/api/content-moderation-api";
import { updateDropBookmark } from "@/services/api/drop-bookmarks-api";
import { saveEulaConsent } from "@/services/api/eula-consent-api";
import { setIdentityFollowing } from "@/services/api/identity-follow-api";
import { setIdentityMuted } from "@/services/api/identity-mute-api";
import {
  createMentionAlias,
  deleteMentionAlias,
  updateMentionAlias,
} from "@/services/api/mention-aliases-api";
import { pinnedWavesApi } from "@/services/api/pinned-waves-api";
import { saveProfilePreferences } from "@/services/api/profile-preferences-api";
import { savePushNotificationSettings } from "@/services/api/push-notification-settings-api";
import {
  setWaveFollowing,
  subscribeToAllWaveDrops,
  updateWaveNotificationPreferences,
} from "@/services/api/wave-follow-api";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import { ApiEulaVersion } from "@/generated/models/ApiEulaVersion";
import {
  type ApiProfilePreferences,
  ApiProfilePreferencesDirectMessagePolicyEnum,
  ApiProfilePreferencesNotificationLevelEnum,
} from "@/generated/models/ApiProfilePreferences";
import {
  ApiUpdateProfilePreferencesDirectMessagePolicyEnum,
  ApiUpdateProfilePreferencesNotificationLevelEnum,
} from "@/generated/models/ApiUpdateProfilePreferences";

const modeOf = (mode: PersonalRecordsMode["mode"]): PersonalRecordsMode => ({
  mode,
  frozen: false,
  owner: `0x${"01".repeat(32)}`,
  siteReader: null,
  providerKeys: [{ id: "test-key", publicKey: `0x${"02".repeat(32)}` }],
});

const IDENTITY_ACTIONS = ["WAVE_CREATED", "DROP_CREATED", "DROP_REPLIED"];

const CURRENT_PREFERENCES: ApiProfilePreferences = {
  direct_message_policy: ApiProfilePreferencesDirectMessagePolicyEnum.Everyone,
  direct_message_group_id: null,
  direct_message_allow_people_i_follow: true,
  direct_message_group_unavailable: false,
  notification_level: ApiProfilePreferencesNotificationLevelEnum.All,
  notifications: {
    direct_messages: true,
    mentions_replies_quotes: true,
    reactions_votes_boosts: true,
    new_followers: true,
    rep_and_nic: true,
    subscription_coverage: true,
  },
};

const FRESH_PREFERENCES: ApiProfilePreferences = {
  ...CURRENT_PREFERENCES,
  direct_message_allow_people_i_follow: false,
};

const PUSH_SETTINGS = {
  identity_subscribed: true,
  identity_mentioned: false,
  identity_rep: true,
  identity_nic: true,
  drop_quoted: true,
  drop_replied: true,
  drop_voted: false,
  drop_reacted: true,
  drop_boosted: true,
  wave_created: true,
  subscription_coverage: true,
};

interface WriterCase {
  readonly name: string;
  readonly write: () => Promise<unknown>;
  /** The legacy request: the mock and its arguments. */
  readonly legacy: readonly [jest.Mock, ...unknown[]];
  /** The records the action becomes. */
  readonly change: PersonalChange;
  /** What shadow sends as the companion, when it differs from the change. */
  readonly companion?: PersonalChange;
  /** What the writer resolves to when only records were written. */
  readonly recordsResult?: unknown;
  /** Reads the change needs (block's follow state, an alias's saved name). */
  readonly setup?: () => void;
}

const items = (...list: PersonalChange["items"]): PersonalChange => ({
  follows: [],
  items: list,
});

const CASES: readonly WriterCase[] = [
  {
    name: "follow a profile",
    write: () => setIdentityFollowing("alice", true),
    legacy: [
      jest.mocked(commonApiPost),
      {
        endpoint: "identities/alice/subscriptions",
        body: { actions: IDENTITY_ACTIONS },
      },
    ],
    change: {
      follows: [{ key: `identity:${OWNER.alice}`, actions: IDENTITY_ACTIONS }],
      items: [],
    },
  },
  {
    name: "unfollow a profile",
    write: () => setIdentityFollowing("alice", false),
    legacy: [
      jest.mocked(commonApiDeleteWithBody),
      {
        endpoint: "identities/alice/subscriptions",
        body: { actions: IDENTITY_ACTIONS },
      },
    ],
    change: {
      follows: [{ key: `identity:${OWNER.alice}`, actions: null }],
      items: [],
    },
  },
  {
    name: "join a wave",
    write: () => setWaveFollowing("wave-1", true),
    legacy: [
      jest.mocked(commonApiPost),
      {
        endpoint: "waves/wave-1/subscriptions",
        body: { actions: ["DROP_CREATED"] },
      },
    ],
    // Wave follows are private: a sealed item, never a public record.
    change: items({
      t: "follow",
      k: "wave:wave-1",
      b: { actions: ["DROP_CREATED"] },
    }),
  },
  {
    name: "leave a wave",
    write: () => setWaveFollowing("wave-1", false),
    legacy: [
      jest.mocked(commonApiDeleteWithBody),
      {
        endpoint: "waves/wave-1/subscriptions",
        body: { actions: ["DROP_CREATED"] },
      },
    ],
    change: items({ t: "follow", k: "wave:wave-1", b: null }),
  },
  {
    name: "notify on every drop after a join",
    write: () => subscribeToAllWaveDrops("wave-1"),
    legacy: [
      jest.mocked(commonApiPost),
      { endpoint: "notifications/wave-subscription/wave-1", body: {} },
    ],
    change: items({
      t: "wave-notify",
      k: "wave-1",
      b: { all_drops: true, groups: ["ALL"] },
    }),
  },
  {
    name: "change a wave's notifications",
    write: () =>
      updateWaveNotificationPreferences("wave-1", {
        subscribed: false,
        enabled_group_notifications: [
          ApiDropGroupMention.Admins,
          ApiDropGroupMention.All,
        ],
      }),
    legacy: [
      jest.mocked(commonApiPost),
      {
        endpoint: "notifications/wave-subscription/wave-1",
        body: {
          subscribed: false,
          enabled_group_notifications: ["ADMINS", "ALL"],
        },
      },
    ],
    change: items({
      t: "wave-notify",
      k: "wave-1",
      b: { all_drops: false, groups: ["ALL", "ADMINS"] },
    }),
    recordsResult: {
      subscribed: false,
      enabled_group_notifications: ["ADMINS", "ALL"],
    },
  },
  {
    name: "mute a profile",
    write: () => setIdentityMuted("alice", true),
    legacy: [
      jest.mocked(commonApiPost),
      { endpoint: "/identities/alice/mute", body: undefined },
    ],
    change: items({ t: "mute", k: OWNER.alice, b: {} }),
    recordsResult: { muted: true },
  },
  {
    name: "unmute a profile",
    write: () => setIdentityMuted("alice", false),
    legacy: [
      jest.mocked(commonApiDelete),
      { endpoint: "/identities/alice/mute" },
    ],
    change: items({ t: "mute", k: OWNER.alice, b: null }),
    recordsResult: { muted: false },
  },
  {
    name: "block a followed profile",
    setup: () =>
      jest
        .mocked(commonApiFetch)
        .mockResolvedValue({ actions: ["DROP_CREATED"] }),
    write: () => blockProfile("profile-b"),
    legacy: [
      jest.mocked(commonApiPut),
      { endpoint: "content-moderation/profiles/profile-b/block", body: {} },
    ],
    change: {
      follows: [{ key: `identity:${OWNER["profile-b"]}`, actions: null }],
      items: [{ t: "block", k: OWNER["profile-b"], b: {} }],
    },
  },
  {
    name: "block a profile not followed",
    setup: () => jest.mocked(commonApiFetch).mockResolvedValue({ actions: [] }),
    write: () => blockProfile("profile-b"),
    legacy: [
      jest.mocked(commonApiPut),
      { endpoint: "content-moderation/profiles/profile-b/block", body: {} },
    ],
    change: items({ t: "block", k: OWNER["profile-b"], b: {} }),
  },
  {
    name: "unblock a profile",
    write: () => unblockProfile("profile-b"),
    legacy: [
      jest.mocked(commonApiDelete),
      {
        endpoint: "content-moderation/profiles/profile-b/block",
        errorMode: "structured",
      },
    ],
    change: items({ t: "block", k: OWNER["profile-b"], b: null }),
  },
  {
    name: "hide a drop",
    write: () => hideDrop("drop-1"),
    legacy: [
      jest.mocked(commonApiPut),
      { endpoint: "content-moderation/drops/drop-1/hide", body: {} },
    ],
    change: items({ t: "hide", k: "drop-1", b: {} }),
  },
  {
    name: "unhide a drop",
    write: () => unhideDrop("drop-1"),
    legacy: [
      jest.mocked(commonApiDelete),
      {
        endpoint: "content-moderation/drops/drop-1/hide",
        errorMode: "structured",
      },
    ],
    change: items({ t: "hide", k: "drop-1", b: null }),
  },
  {
    name: "bookmark a drop",
    write: () => updateDropBookmark("drop-1", true),
    legacy: [
      jest.mocked(commonApiPost),
      { endpoint: "drops/drop-1/bookmark", body: undefined },
    ],
    change: items({ t: "bookmark", k: "drop-1", b: {} }),
    recordsResult: null,
  },
  {
    name: "remove a bookmark",
    write: () => updateDropBookmark("drop-1", false),
    legacy: [
      jest.mocked(commonApiDeleteWithResponse),
      { endpoint: "drops/drop-1/bookmark" },
    ],
    change: items({ t: "bookmark", k: "drop-1", b: null }),
    recordsResult: null,
  },
  {
    name: "turn artwork alerts on",
    write: () => setArtworkAlert("artist", true),
    legacy: [
      jest.mocked(commonApiPost),
      { endpoint: "identities/artist/artwork-alerts", body: undefined },
    ],
    change: items({ t: "art-alert", k: OWNER.artist, b: {} }),
    recordsResult: { enabled: true },
  },
  {
    name: "turn artwork alerts off",
    write: () => setArtworkAlert("artist", false),
    legacy: [
      jest.mocked(commonApiDelete),
      { endpoint: "identities/artist/artwork-alerts" },
    ],
    change: items({ t: "art-alert", k: OWNER.artist, b: null }),
    recordsResult: { enabled: false },
  },
  {
    name: "pin a wave after the pins shown",
    write: () => pinnedWavesApi.pinWave("wave-3", ["wave-1", "wave-2"]),
    legacy: [
      jest.mocked(commonApiPostWithoutBodyAndResponse),
      { endpoint: "waves/wave-3/pins" },
    ],
    change: items(
      { t: "pin", k: "wave-1", b: { pos: 0 } },
      { t: "pin", k: "wave-2", b: { pos: 1 } },
      { t: "pin", k: "wave-3", b: { pos: 2 } }
    ),
  },
  {
    name: "unpin a wave",
    write: () => pinnedWavesApi.unpinWave("wave-1"),
    legacy: [jest.mocked(commonApiDelete), { endpoint: "waves/wave-1/pins" }],
    change: items({ t: "pin", k: "wave-1", b: null }),
  },
  {
    name: "reorder pinned waves",
    write: () =>
      pinnedWavesApi.updateOrder({
        previous_wave_ids: ["wave-1", "wave-2"],
        wave_ids: ["wave-2", "wave-1"],
      }),
    legacy: [
      jest.mocked(commonApiPut),
      {
        endpoint: "v2/waves/pinned",
        body: {
          previous_wave_ids: ["wave-1", "wave-2"],
          wave_ids: ["wave-2", "wave-1"],
        },
      },
    ],
    change: items(
      { t: "pin", k: "wave-2", b: { pos: 0 } },
      { t: "pin", k: "wave-1", b: { pos: 1 } }
    ),
    recordsResult: { wave_ids: ["wave-2", "wave-1"] },
  },
  {
    name: "limit direct messages to a group",
    // The saved preferences, read fresh: another tab turned the follow
    // exception off since this tab loaded them.
    setup: () =>
      jest.mocked(commonApiFetch).mockResolvedValue(FRESH_PREFERENCES),
    write: () =>
      saveProfilePreferences({
        direct_message_policy:
          ApiUpdateProfilePreferencesDirectMessagePolicyEnum.GroupMembers,
        direct_message_group_id: "group-1",
      }),
    legacy: [
      jest.mocked(commonApiPut),
      {
        endpoint: "profile-preferences",
        body: {
          direct_message_policy: "GROUP_MEMBERS",
          direct_message_group_id: "group-1",
        },
      },
    ],
    change: items({
      t: "pref",
      k: "dm",
      b: {
        policy: "GROUP_MEMBERS",
        group_id: "group-1",
        allow_people_i_follow: false,
      },
    }),
    recordsResult: {
      ...FRESH_PREFERENCES,
      direct_message_policy: "GROUP_MEMBERS",
      direct_message_group_id: "group-1",
    },
  },
  {
    name: "change the notification level and a category",
    setup: () =>
      jest.mocked(commonApiFetch).mockResolvedValue(CURRENT_PREFERENCES),
    write: () =>
      saveProfilePreferences({
        notification_level:
          ApiUpdateProfilePreferencesNotificationLevelEnum.EssentialOnly,
        notifications: { new_followers: false },
      }),
    legacy: [
      jest.mocked(commonApiPut),
      {
        endpoint: "profile-preferences",
        body: {
          notification_level: "ESSENTIAL_ONLY",
          notifications: { new_followers: false },
        },
      },
    ],
    change: items(
      { t: "pref", k: "level", b: { value: "ESSENTIAL_ONLY" } },
      { t: "pref", k: "notify.new_followers", b: { on: false } }
    ),
    recordsResult: {
      ...CURRENT_PREFERENCES,
      notification_level: "ESSENTIAL_ONLY",
      notifications: {
        ...CURRENT_PREFERENCES.notifications,
        new_followers: false,
      },
    },
  },
  {
    name: "create a mention shortcut",
    write: () =>
      createMentionAlias({
        alias: "@Frens",
        member_profile_ids: ["profile-1", "profile-2"],
      }),
    legacy: [
      jest.mocked(commonApiPost),
      {
        endpoint: "mention-aliases",
        body: {
          alias: "@Frens",
          member_profile_ids: ["profile-1", "profile-2"],
        },
      },
    ],
    change: items({
      t: "alias",
      k: "frens",
      b: { members: [OWNER["profile-1"], OWNER["profile-2"]], new: true },
    }),
    // Today's request already made it: the companion is no create.
    companion: items({
      t: "alias",
      k: "frens",
      b: { members: [OWNER["profile-1"], OWNER["profile-2"]] },
    }),
    recordsResult: null,
  },
  {
    name: "rename a mention shortcut",
    setup: () =>
      jest
        .mocked(commonApiFetch)
        .mockResolvedValue([{ id: "alias-1", alias: "frens", members: [] }]),
    write: () =>
      updateMentionAlias("alias-1", {
        alias: "crew",
        member_profile_ids: ["profile-1"],
      }),
    legacy: [
      jest.mocked(commonApiPut),
      {
        endpoint: "mention-aliases/alias-1",
        body: { alias: "crew", member_profile_ids: ["profile-1"] },
      },
    ],
    // The new name takes the alias first, then the old name is unset.
    change: items(
      {
        t: "alias",
        k: "crew",
        b: { members: [OWNER["profile-1"]], from: "frens" },
      },
      { t: "alias", k: "frens", b: null }
    ),
    recordsResult: null,
  },
  {
    name: "change a mention shortcut's members",
    setup: () =>
      jest
        .mocked(commonApiFetch)
        .mockResolvedValue([{ id: "alias-1", alias: "frens", members: [] }]),
    write: () =>
      updateMentionAlias("alias-1", {
        alias: "frens",
        member_profile_ids: ["profile-1"],
      }),
    legacy: [
      jest.mocked(commonApiPut),
      {
        endpoint: "mention-aliases/alias-1",
        body: { alias: "frens", member_profile_ids: ["profile-1"] },
      },
    ],
    change: items({
      t: "alias",
      k: "frens",
      b: { members: [OWNER["profile-1"]] },
    }),
    recordsResult: null,
  },
  {
    name: "delete a mention shortcut",
    setup: () =>
      jest
        .mocked(commonApiFetch)
        .mockResolvedValue([{ id: "alias-1", alias: "frens", members: [] }]),
    write: () => deleteMentionAlias("alias-1"),
    legacy: [
      jest.mocked(commonApiDelete),
      { endpoint: "mention-aliases/alias-1" },
    ],
    change: items({ t: "alias", k: "frens", b: null }),
  },
  {
    name: "save push settings",
    write: () => savePushNotificationSettings("push-device-1", PUSH_SETTINGS),
    legacy: [
      jest.mocked(commonApiPut),
      {
        endpoint: "push-notifications/settings/push-device-1",
        body: PUSH_SETTINGS,
      },
    ],
    change: items({ t: "push", k: "push-device-1", b: PUSH_SETTINGS }),
    recordsResult: PUSH_SETTINGS,
  },
  {
    name: "accept the EULA",
    write: () =>
      saveEulaConsent({
        device_id: "device-1",
        platform: "ios",
        eula_version: ApiEulaVersion._20260824,
      }),
    legacy: [
      jest.mocked(commonApiPost),
      {
        endpoint: "policies/eula-consent",
        body: {
          device_id: "device-1",
          platform: "ios",
          eula_version: ApiEulaVersion._20260824,
        },
        errorMode: "structured",
      },
    ],
    change: items({
      t: "eula",
      k: "device-1",
      b: { version: ApiEulaVersion._20260824, platform: "ios" },
    }),
  },
];

/** Lets shadow mode's records, sent after the write resolves, go out. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const LEGACY_MOCKS = [
  commonApiPost,
  commonApiPut,
  commonApiDelete,
  commonApiDeleteWithBody,
  commonApiDeleteWithResponse,
  commonApiPostWithoutBodyAndResponse,
].map((mock) => jest.mocked(mock));

beforeEach(() => {
  jest.clearAllMocks();
  mockSubmit.mockResolvedValue({ status: "saved" });
  for (const mock of LEGACY_MOCKS) {
    mock.mockResolvedValue(undefined as never);
  }
});

describe.each(CASES)("$name", (testCase) => {
  const [legacyMock, ...legacyArgs] = testCase.legacy;

  beforeEach(() => {
    testCase.setup?.();
  });

  it("legacy mode sends today's request and no records", async () => {
    mockGetMode.mockResolvedValue(modeOf("legacy"));
    await testCase.write();
    await settle();
    expect(legacyMock).toHaveBeenCalledTimes(1);
    expect(legacyMock).toHaveBeenCalledWith(...legacyArgs);
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("shadow mode sends today's request, then the records", async () => {
    const mode = modeOf("shadow");
    mockGetMode.mockResolvedValue(mode);
    await testCase.write();
    await settle();
    expect(legacyMock).toHaveBeenCalledWith(...legacyArgs);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(
      testCase.companion ?? testCase.change,
      mode,
      { companion: true }
    );
    expect(legacyMock.mock.invocationCallOrder[0]).toBeLessThan(
      mockSubmit.mock.invocationCallOrder[0]!
    );
  });

  it("primary mode sends the records only", async () => {
    const mode = modeOf("primary");
    mockGetMode.mockResolvedValue(mode);
    const result = await testCase.write();
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledWith(testCase.change, mode, {
      companion: false,
    });
    for (const mock of LEGACY_MOCKS) {
      expect(mock).not.toHaveBeenCalled();
    }
    if ("recordsResult" in testCase) {
      expect(result).toEqual(testCase.recordsResult);
    }
  });
});

describe("EULA consent without a signed-in owner", () => {
  it("keeps today's route in primary mode", async () => {
    mockGetMode.mockResolvedValue({ ...modeOf("primary"), owner: null });
    await saveEulaConsent({
      device_id: "device-1",
      platform: "ios",
      eula_version: ApiEulaVersion._20260824,
    });
    expect(commonApiPost).toHaveBeenCalledTimes(1);
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("keeps today's route when the device has no grant", async () => {
    mockGetMode.mockResolvedValue(modeOf("primary"));
    mockSubmit.mockResolvedValue({ status: "no-grant" });
    await saveEulaConsent({
      device_id: "device-1",
      platform: "ios",
      eula_version: ApiEulaVersion._20260824,
    });
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(commonApiPost).toHaveBeenCalledTimes(1);
  });
});
