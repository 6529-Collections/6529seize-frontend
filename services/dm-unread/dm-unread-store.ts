import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import type { ApiDmUnreadSnapshot } from "@/generated/models/ApiDmUnreadSnapshot";

interface OptimisticDmRead {
  readonly id: number;
  readonly targetSerialNo: number;
  readonly baseUnreadCount: number;
  readonly firstUnreadAfterTargetSerialNo: number | null;
}

interface StoredDmUnreadConversation {
  readonly server: ApiDmUnreadConversationState;
  readonly optimisticRead: OptimisticDmRead | null;
}

interface DmUnreadProfileState {
  readonly conversations: Readonly<Record<string, StoredDmUnreadConversation>>;
}

interface DmUnreadStoreSnapshot {
  readonly profiles: Readonly<Record<string, DmUnreadProfileState>>;
  readonly snapshotReadyProfiles: Readonly<Record<string, true>>;
}

export interface DmUnreadReadOperation {
  readonly id: number;
  readonly profileId: string;
  readonly waveId: string;
  readonly readThroughSerialNo: number;
}

export interface DmUnreadSummary {
  readonly totalUnreadMessages: number;
  readonly unreadConversationCount: number;
  readonly hasUnread: boolean;
}

const EMPTY_STORE_SNAPSHOT: DmUnreadStoreSnapshot = {
  profiles: {},
  snapshotReadyProfiles: {},
};
const EMPTY_SUMMARY: DmUnreadSummary = {
  totalUnreadMessages: 0,
  unreadConversationCount: 0,
  hasUnread: false,
};

const toNonNegativeInteger = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value);
};

const normalizeState = (
  state: ApiDmUnreadConversationState
): ApiDmUnreadConversationState | null => {
  if (!state.profile_id || !state.wave_id) {
    return null;
  }
  return {
    profile_id: state.profile_id,
    wave_id: state.wave_id,
    unread_count: toNonNegativeInteger(state.unread_count),
    first_unread_drop_serial_no:
      state.first_unread_drop_serial_no === null
        ? null
        : toNonNegativeInteger(state.first_unread_drop_serial_no) || null,
    latest_drop_serial_no: toNonNegativeInteger(state.latest_drop_serial_no),
    latest_read_serial_no: toNonNegativeInteger(state.latest_read_serial_no),
    version: toNonNegativeInteger(state.version),
  };
};

const getDisplayedUnreadCount = (
  conversation: StoredDmUnreadConversation
): number => {
  const { optimisticRead, server } = conversation;
  if (!optimisticRead) {
    return server.unread_count;
  }
  if (server.latest_read_serial_no >= optimisticRead.targetSerialNo) {
    return server.unread_count;
  }
  if (server.latest_drop_serial_no <= optimisticRead.targetSerialNo) {
    return 0;
  }
  return Math.max(0, server.unread_count - optimisticRead.baseUnreadCount);
};

const getDisplayedConversation = (
  conversation: StoredDmUnreadConversation | undefined
): ApiDmUnreadConversationState | null => {
  if (!conversation) {
    return null;
  }
  const unreadCount = getDisplayedUnreadCount(conversation);
  if (unreadCount === conversation.server.unread_count) {
    return conversation.server;
  }
  return {
    ...conversation.server,
    unread_count: unreadCount,
    first_unread_drop_serial_no:
      unreadCount > 0
        ? (conversation.optimisticRead?.firstUnreadAfterTargetSerialNo ??
          conversation.server.first_unread_drop_serial_no)
        : null,
  };
};

const mergeServerState = (
  current: StoredDmUnreadConversation | undefined,
  incomingValue: ApiDmUnreadConversationState
): StoredDmUnreadConversation | undefined => {
  const incoming = normalizeState(incomingValue);
  if (!incoming) {
    return current;
  }
  if (current && incoming.version <= current.server.version) {
    return current;
  }
  const currentOptimisticRead = current?.optimisticRead ?? null;
  const optimisticRead =
    currentOptimisticRead &&
    incoming.latest_read_serial_no < currentOptimisticRead.targetSerialNo
      ? {
          ...currentOptimisticRead,
          firstUnreadAfterTargetSerialNo:
            incoming.latest_drop_serial_no >
              currentOptimisticRead.targetSerialNo &&
            currentOptimisticRead.firstUnreadAfterTargetSerialNo === null
              ? incoming.latest_drop_serial_no
              : currentOptimisticRead.firstUnreadAfterTargetSerialNo,
        }
      : null;
  return { server: incoming, optimisticRead };
};

export class DmUnreadStore {
  private snapshot: DmUnreadStoreSnapshot = EMPTY_STORE_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  private nextReadOperationId = 1;

  readonly getSnapshot = (): DmUnreadStoreSnapshot => this.snapshot;

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private publish(next: DmUnreadStoreSnapshot): void {
    if (next === this.snapshot) {
      return;
    }
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }

  applyServerState(incoming: ApiDmUnreadConversationState): boolean {
    const normalized = normalizeState(incoming);
    if (!normalized) {
      return false;
    }
    const profile = this.snapshot.profiles[normalized.profile_id];
    const current = profile?.conversations[normalized.wave_id];
    const nextConversation = mergeServerState(current, normalized);
    if (!nextConversation || nextConversation === current) {
      return false;
    }
    this.publish({
      profiles: {
        ...this.snapshot.profiles,
        [normalized.profile_id]: {
          conversations: {
            ...profile?.conversations,
            [normalized.wave_id]: nextConversation,
          },
        },
      },
      snapshotReadyProfiles: this.snapshot.snapshotReadyProfiles,
    });
    return true;
  }

  applySnapshot(snapshot: ApiDmUnreadSnapshot): boolean {
    const profileId = snapshot.profile_id;
    if (!profileId) {
      return false;
    }
    const currentProfile = this.snapshot.profiles[profileId];
    const wasSnapshotReady =
      this.snapshot.snapshotReadyProfiles[profileId] === true;
    let conversations = currentProfile?.conversations ?? {};
    let changed = false;
    for (const incoming of snapshot.conversations) {
      if (incoming.profile_id !== profileId) {
        continue;
      }
      const current = conversations[incoming.wave_id];
      const next = mergeServerState(current, incoming);
      if (!next || next === current) {
        continue;
      }
      conversations = { ...conversations, [incoming.wave_id]: next };
      changed = true;
    }
    if (!changed && currentProfile && wasSnapshotReady) {
      return false;
    }
    this.publish({
      profiles: {
        ...this.snapshot.profiles,
        [profileId]: { conversations },
      },
      snapshotReadyProfiles: {
        ...this.snapshot.snapshotReadyProfiles,
        [profileId]: true,
      },
    });
    return true;
  }

  beginRead(
    profileId: string | null,
    waveId: string,
    requestedSerialNo?: number
  ): DmUnreadReadOperation | null {
    if (!profileId) {
      return null;
    }
    const profile = this.snapshot.profiles[profileId];
    const current = profile?.conversations[waveId];
    const targetSerialNo = Math.max(
      current?.server.latest_drop_serial_no ?? 0,
      toNonNegativeInteger(requestedSerialNo ?? 0)
    );
    if (!profile || !current || targetSerialNo <= 0) {
      return null;
    }
    if (
      getDisplayedUnreadCount(current) === 0 &&
      targetSerialNo <= current.server.latest_read_serial_no
    ) {
      return null;
    }
    const existingRead = current.optimisticRead;
    if (existingRead && existingRead.targetSerialNo >= targetSerialNo) {
      return {
        id: existingRead.id,
        profileId,
        waveId,
        readThroughSerialNo: existingRead.targetSerialNo,
      };
    }
    const optimisticRead: OptimisticDmRead = {
      id: this.nextReadOperationId++,
      targetSerialNo,
      baseUnreadCount: current.server.unread_count,
      firstUnreadAfterTargetSerialNo: null,
    };
    this.publish({
      profiles: {
        ...this.snapshot.profiles,
        [profileId]: {
          conversations: {
            ...profile.conversations,
            [waveId]: { ...current, optimisticRead },
          },
        },
      },
      snapshotReadyProfiles: this.snapshot.snapshotReadyProfiles,
    });
    return {
      id: optimisticRead.id,
      profileId,
      waveId,
      readThroughSerialNo: optimisticRead.targetSerialNo,
    };
  }

  rollbackRead(operation: DmUnreadReadOperation): boolean {
    const profile = this.snapshot.profiles[operation.profileId];
    const current = profile?.conversations[operation.waveId];
    if (!profile || current?.optimisticRead?.id !== operation.id) {
      return false;
    }
    this.publish({
      profiles: {
        ...this.snapshot.profiles,
        [operation.profileId]: {
          conversations: {
            ...profile.conversations,
            [operation.waveId]: { ...current, optimisticRead: null },
          },
        },
      },
      snapshotReadyProfiles: this.snapshot.snapshotReadyProfiles,
    });
    return true;
  }
}

export const getDmUnreadConversation = (
  snapshot: DmUnreadStoreSnapshot,
  profileId: string | null,
  waveId: string
): ApiDmUnreadConversationState | null =>
  profileId
    ? getDisplayedConversation(
        snapshot.profiles[profileId]?.conversations[waveId]
      )
    : null;

export const getDmUnreadSnapshotReady = (
  snapshot: DmUnreadStoreSnapshot,
  profileId: string | null
): boolean =>
  profileId !== null && snapshot.snapshotReadyProfiles[profileId] === true;

export const getDmUnreadConversations = (
  snapshot: DmUnreadStoreSnapshot,
  profileId: string | null
): Readonly<Record<string, ApiDmUnreadConversationState>> => {
  if (!profileId) {
    return {};
  }
  const conversations = snapshot.profiles[profileId]?.conversations;
  if (!conversations) {
    return {};
  }
  return Object.entries(conversations).reduce(
    (result, [waveId, conversation]) => {
      const displayed = getDisplayedConversation(conversation);
      if (displayed) {
        result[waveId] = displayed;
      }
      return result;
    },
    {} as Record<string, ApiDmUnreadConversationState>
  );
};

export const getDmUnreadSummary = (
  snapshot: DmUnreadStoreSnapshot,
  profileId: string | null
): DmUnreadSummary => {
  if (!profileId) {
    return EMPTY_SUMMARY;
  }
  const conversations = snapshot.profiles[profileId]?.conversations;
  if (!conversations) {
    return EMPTY_SUMMARY;
  }
  let totalUnreadMessages = 0;
  let unreadConversationCount = 0;
  Object.values(conversations).forEach((conversation) => {
    const unreadCount = getDisplayedUnreadCount(conversation);
    totalUnreadMessages += unreadCount;
    if (unreadCount > 0) {
      unreadConversationCount++;
    }
  });
  return {
    totalUnreadMessages,
    unreadConversationCount,
    hasUnread: unreadConversationCount > 0,
  };
};
