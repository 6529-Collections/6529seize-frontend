import type { ReactNode } from "react";
import {
  E2eeContext,
  type E2eeAvailability,
  type E2eeContextValue,
} from "@/components/e2ee/E2eeContext";
import {
  createE2eeEngineStore,
  type E2eeEngineStore,
} from "@/components/e2ee/e2eeEngineStore";
import type {
  E2eeConversation,
  E2eeDeviceInfo,
  E2eeEngine,
  E2eeEngineStatus,
  E2eeMember,
  E2eeMessage,
} from "@/lib/e2ee/types";

export const SELF_ID = "profile-self";
export const ALICE_ID = "profile-alice";
export const BOB_ID = "profile-bob";
export const GROUP_G = `0x${"a".repeat(64)}`;
export const DM_G = `0x${"b".repeat(64)}`;

export const member = (
  profileId: string,
  handle: string | null,
  overrides: Partial<E2eeMember> = {}
): E2eeMember => ({
  profileId,
  handle,
  pfp: null,
  wallets: [],
  isAdmin: false,
  devices: [
    {
      deviceKey: `0x${profileId}`,
      label: `${handle ?? "x"} laptop`,
      verified: true,
      wallet: null,
    },
  ],
  ...overrides,
});

export const message = (
  overrides: Partial<E2eeMessage> & Pick<E2eeMessage, "id">
): E2eeMessage => ({
  g: GROUP_G,
  seq: 1,
  kind: "message",
  senderProfileId: ALICE_ID,
  senderDeviceKey: "0xdevice",
  ts: Date.UTC(2026, 9, 12, 10, 0),
  serverTs: Date.UTC(2026, 9, 12, 10, 0),
  text: "",
  mentions: [],
  reply: null,
  attachments: [],
  editedAt: null,
  deleted: false,
  reactions: {},
  sigOk: true,
  undecryptable: false,
  pending: false,
  ...overrides,
});

export const conversation = (
  overrides: Partial<E2eeConversation> = {}
): E2eeConversation => ({
  g: GROUP_G,
  kind: "group",
  name: "Collectors",
  members: [
    member(SELF_ID, "me", { isAdmin: true }),
    member(ALICE_ID, "alice"),
    member(BOB_ID, "bob"),
  ],
  admins: [SELF_ID],
  createdBy: SELF_ID,
  epoch: 3,
  safetyCode: "abcd ef01 2345 6789",
  status: "active",
  delayed: false,
  splitView: false,
  untrustedDevices: [],
  lastMessage: null,
  unread: 0,
  mentions: 0,
  updatedAt: Date.UTC(2026, 9, 12, 10, 0),
  ...overrides,
});

export const device = (
  overrides: Partial<E2eeDeviceInfo> & Pick<E2eeDeviceInfo, "deviceKey">
): E2eeDeviceInfo => ({
  label: "Device",
  platform: "web",
  createdAt: Date.UTC(2026, 9, 1),
  lastSeenAt: Date.UTC(2026, 9, 12),
  expiresAt: Date.UTC(2027, 3, 1),
  revokedAt: null,
  isThisDevice: false,
  verified: true,
  ...overrides,
});

export interface FakeEngineState {
  status: E2eeEngineStatus;
  error: string | null;
  thisDevice: E2eeDeviceInfo | null;
  devices: E2eeDeviceInfo[];
  conversations: E2eeConversation[];
  messages: Record<string, E2eeMessage[]>;
  attachmentsEnabled: boolean;
}

export type FakeE2eeEngine = E2eeEngine & {
  readonly state: FakeEngineState;
  /** Mutate state and notify subscribers, like a real engine change. */
  readonly update: (change: Partial<FakeEngineState>) => void;
};

/** In-memory engine implementing the contract section 12 interface. */
export function createFakeE2eeEngine(
  initial: Partial<FakeEngineState> = {}
): FakeE2eeEngine {
  const listeners = new Set<() => void>();
  const state: FakeEngineState = {
    status: "ready",
    error: null,
    thisDevice: null,
    devices: [],
    conversations: [],
    messages: {},
    attachmentsEnabled: true,
    ...initial,
  };
  const notify = () => {
    for (const listener of [...listeners]) {
      listener();
    }
  };
  const engine: FakeE2eeEngine = {
    state,
    update: (change) => {
      Object.assign(state, change);
      notify();
    },
    getStatus: () => state.status,
    getError: () => state.error,
    getThisDevice: () => state.thisDevice,
    getDevices: () => state.devices,
    getAttachmentsEnabled: () => state.attachmentsEnabled,
    getConversations: () => state.conversations,
    getConversation: (g) =>
      state.conversations.find((item) => item.g === g) ?? null,
    getMessages: (g) => state.messages[g] ?? [],
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    enroll: jest.fn(async () => undefined),
    sync: jest.fn(async () => undefined),
    dispose: jest.fn(),
    checkEligibility: jest.fn(async (profileIds: string[]) =>
      profileIds.map((profileId) => ({ profileId, status: "OK" as const }))
    ),
    createConversation: jest.fn(async () => GROUP_G),
    findDm: jest.fn(() => null),
    send: jest.fn(async () => undefined),
    sendImported: jest.fn(async () => undefined),
    edit: jest.fn(async () => undefined),
    remove: jest.fn(async () => undefined),
    react: jest.fn(async () => undefined),
    markRead: jest.fn(),
    rename: jest.fn(async () => undefined),
    addMembers: jest.fn(async (_g: string, profileIds: string[]) =>
      profileIds.map((profileId) => ({ profileId, status: "OK" as const }))
    ),
    removeMember: jest.fn(async () => undefined),
    setAdmin: jest.fn(async () => undefined),
    leave: jest.fn(async () => undefined),
    restart: jest.fn(async () => DM_G),
    report: jest.fn(async () => undefined),
    reportPreview: jest.fn((g: string, id: string) => {
      const message = (state.messages[g] ?? []).find((item) => item.id === id);
      return {
        latest: message
          ? {
              text: message.text,
              attachmentNames: message.attachments.map((att) => att.name),
            }
          : null,
        original: null,
      };
    }),
    search: jest.fn(async () => []),
    getAttachment: jest.fn(async () => new Blob(["x"], { type: "image/png" })),
    trustDevice: jest.fn(async () => undefined),
    ignoreDevice: jest.fn(async () => undefined),
    revokeDevice: jest.fn(async () => undefined),
    renameThisDevice: jest.fn(async () => undefined),
  };
  return engine;
}

export function contextFor(
  engine: E2eeEngine | null,
  overrides: Partial<E2eeContextValue> & {
    readonly availability?: E2eeAvailability;
  } = {}
): E2eeContextValue & { readonly store: E2eeEngineStore | null } {
  const store = engine ? createE2eeEngineStore(engine) : null;
  return {
    availability: engine ? "loaded" : "idle",
    profileId: SELF_ID,
    engine,
    store,
    backup: null,
    loadError: null,
    restart: jest.fn(),
    takeOverHere: jest.fn(),
    ...overrides,
  };
}

export function E2eeTestProvider({
  value,
  children,
}: {
  readonly value: E2eeContextValue;
  readonly children: ReactNode;
}) {
  return <E2eeContext.Provider value={value}>{children}</E2eeContext.Provider>;
}
