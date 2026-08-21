import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import type { ApiDmUnreadSnapshot } from "@/generated/models/ApiDmUnreadSnapshot";

interface OptimisticDmRead {
  readonly id: number;
  readonly targetSerialNo: number;
  readonly optimisticallyClearedUnreadCount: number;
  readonly firstUnreadAfterTargetSerialNo: number | null;
}

interface StoredDmUnreadConversation {
  readonly server: ApiDmUnreadConversationState;
  readonly optimisticRead: OptimisticDmRead | null;
  readonly lastServerUpdateSequence: number;
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
  if (
    server.first_unread_drop_serial_no !== null &&
    server.first_unread_drop_serial_no > optimisticRead.targetSerialNo
  ) {
    return server.unread_count;
  }
  return Math.max(
    0,
    server.unread_count - optimisticRead.optimisticallyClearedUnreadCount
  );
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

const serverStatesEqual = (
  left: ApiDmUnreadConversationState,
  right: ApiDmUnreadConversationState
): boolean =>
  left.profile_id === right.profile_id &&
  left.wave_id === right.wave_id &&
  left.unread_count === right.unread_count &&
  left.first_unread_drop_serial_no === right.first_unread_drop_serial_no &&
  left.latest_drop_serial_no === right.latest_drop_serial_no &&
  left.latest_read_serial_no === right.latest_read_serial_no &&
  left.version === right.version;

const mergeServerState = (
  current: StoredDmUnreadConversation | undefined,
  incomingValue: ApiDmUnreadConversationState,
  updateSequence: number,
  authoritative = false
): StoredDmUnreadConversation | undefined => {
  const incoming = normalizeState(incomingValue);
  if (!incoming) {
    return current;
  }
  if (current && !authoritative && incoming.version <= current.server.version) {
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
  const isUnchanged = current
    ? serverStatesEqual(incoming, current.server) &&
      optimisticRead === current.optimisticRead
    : false;
  if (isUnchanged) {
    return current;
  }
  return {
    server: incoming,
    optimisticRead,
    lastServerUpdateSequence: updateSequence,
  };
};

export class DmUnreadStore {
  private snapshot: DmUnreadStoreSnapshot = EMPTY_STORE_SNAPSHOT;
  private readonly listeners = new Set<() => void>();
  private nextReadOperationId = 1;
  private serverUpdateSequence = 0;

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

  beginSnapshot(): number {
    return this.serverUpdateSequence;
  }

  needsIncomingDropRecovery(
    profileId: string,
    waveId: string,
    serialNo: number
  ): boolean {
    const incomingSerialNo = toNonNegativeInteger(serialNo);
    if (incomingSerialNo === 0) {
      return false;
    }
    const conversation =
      this.snapshot.profiles[profileId]?.conversations[waveId];
    if (
      !conversation ||
      conversation.server.latest_drop_serial_no < incomingSerialNo
    ) {
      return true;
    }
    return (
      conversation.server.unread_count > getDisplayedUnreadCount(conversation)
    );
  }

  resetProfile(profileId: string): boolean {
    if (
      this.snapshot.profiles[profileId] === undefined &&
      this.snapshot.snapshotReadyProfiles[profileId] !== true
    ) {
      return false;
    }
    const { [profileId]: _removedProfile, ...profiles } =
      this.snapshot.profiles;
    const { [profileId]: _removedReadiness, ...snapshotReadyProfiles } =
      this.snapshot.snapshotReadyProfiles;
    this.publish({ profiles, snapshotReadyProfiles });
    return true;
  }

  applyServerState(incoming: ApiDmUnreadConversationState): boolean {
    const normalized = normalizeState(incoming);
    if (!normalized) {
      return false;
    }
    const profile = this.snapshot.profiles[normalized.profile_id];
    const current = profile?.conversations[normalized.wave_id];
    const updateSequence = ++this.serverUpdateSequence;
    const nextConversation = mergeServerState(
      current,
      normalized,
      updateSequence
    );
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

  applySnapshot(
    snapshot: ApiDmUnreadSnapshot,
    startedAtSequence = this.serverUpdateSequence
  ): boolean {
    const profileId = snapshot.profile_id;
    if (!profileId) {
      return false;
    }
    const currentProfile = this.snapshot.profiles[profileId];
    const wasSnapshotReady =
      this.snapshot.snapshotReadyProfiles[profileId] === true;
    const currentConversations = currentProfile?.conversations ?? {};
    const conversations: Record<string, StoredDmUnreadConversation> = {};
    for (const incoming of snapshot.conversations) {
      if (incoming.profile_id !== profileId) {
        continue;
      }
      const current = currentConversations[incoming.wave_id];
      const hasNewerServerUpdate =
        current !== undefined &&
        current.lastServerUpdateSequence > startedAtSequence;
      const next = mergeServerState(
        current,
        incoming,
        hasNewerServerUpdate
          ? current.lastServerUpdateSequence
          : startedAtSequence,
        !hasNewerServerUpdate
      );
      if (!next) {
        continue;
      }
      conversations[incoming.wave_id] = next;
    }
    Object.entries(currentConversations).forEach(([waveId, conversation]) => {
      if (
        conversations[waveId] === undefined &&
        conversation.lastServerUpdateSequence > startedAtSequence
      ) {
        conversations[waveId] = conversation;
      }
    });
    const currentWaveIds = Object.keys(currentConversations);
    const nextWaveIds = Object.keys(conversations);
    const conversationsUnchanged =
      currentWaveIds.length === nextWaveIds.length &&
      nextWaveIds.every(
        (waveId) => currentConversations[waveId] === conversations[waveId]
      );
    if (conversationsUnchanged && currentProfile && wasSnapshotReady) {
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
    const targetSerialNo =
      requestedSerialNo === undefined
        ? (current?.server.latest_drop_serial_no ?? 0)
        : toNonNegativeInteger(requestedSerialNo);
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
      optimisticallyClearedUnreadCount:
        targetSerialNo >= current.server.latest_drop_serial_no
          ? current.server.unread_count
          : 0,
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
