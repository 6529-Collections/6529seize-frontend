import type { ApiDmUnreadConversationState } from "@/generated/models/ApiDmUnreadConversationState";
import {
  DmUnreadStore,
  getDmUnreadConversation,
  getDmUnreadSnapshotReady,
  getDmUnreadSummary,
} from "@/services/dm-unread/dm-unread-store";

const state = ({
  profileId = "profile-a",
  waveId = "wave-a",
  unreadCount,
  firstUnreadSerialNo = unreadCount > 0 ? 10 : null,
  latestDropSerialNo = 10,
  latestReadSerialNo = unreadCount > 0 ? 0 : latestDropSerialNo,
  version,
}: {
  readonly profileId?: string;
  readonly waveId?: string;
  readonly unreadCount: number;
  readonly firstUnreadSerialNo?: number | null;
  readonly latestDropSerialNo?: number;
  readonly latestReadSerialNo?: number;
  readonly version: number;
}): ApiDmUnreadConversationState => ({
  profile_id: profileId,
  wave_id: waveId,
  unread_count: unreadCount,
  first_unread_drop_serial_no: firstUnreadSerialNo,
  latest_drop_serial_no: latestDropSerialNo,
  latest_read_serial_no: latestReadSerialNo,
  version,
});

describe("DmUnreadStore", () => {
  it("reports readiness only after a complete snapshot is applied", () => {
    const store = new DmUnreadStore();
    store.applyServerState(state({ unreadCount: 1, version: 1 }));

    expect(getDmUnreadSnapshotReady(store.getSnapshot(), "profile-a")).toBe(
      false
    );

    store.applySnapshot({
      profile_id: "profile-a",
      count: 1,
      conversations: [state({ unreadCount: 1, version: 1 })],
    });

    expect(getDmUnreadSnapshotReady(store.getSnapshot(), "profile-a")).toBe(
      true
    );
  });

  it("derives one unread message in one conversation", () => {
    const store = new DmUnreadStore();
    store.applyServerState(state({ unreadCount: 1, version: 1 }));

    expect(getDmUnreadSummary(store.getSnapshot(), "profile-a")).toEqual({
      totalUnreadMessages: 1,
      unreadConversationCount: 1,
      hasUnread: true,
    });
  });

  it("clamps negative server counters and serials to zero", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({
        unreadCount: -2,
        firstUnreadSerialNo: -1,
        latestDropSerialNo: -4,
        latestReadSerialNo: -3,
        version: -1,
      })
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
    ).toEqual({
      profile_id: "profile-a",
      wave_id: "wave-a",
      unread_count: 0,
      first_unread_drop_serial_no: null,
      latest_drop_serial_no: 0,
      latest_read_serial_no: 0,
      version: 0,
    });
  });

  it("derives totals from multiple messages across multiple conversations", () => {
    const store = new DmUnreadStore();
    store.applyServerState(state({ unreadCount: 2, version: 1 }));
    store.applyServerState(
      state({ waveId: "wave-b", unreadCount: 3, version: 1 })
    );

    expect(getDmUnreadSummary(store.getSnapshot(), "profile-a")).toEqual({
      totalUnreadMessages: 5,
      unreadConversationCount: 2,
      hasUnread: true,
    });
  });

  it("clears every local selector immediately and accepts a cross-device read", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({
        unreadCount: 2,
        firstUnreadSerialNo: 9,
        latestDropSerialNo: 10,
        version: 1,
      })
    );

    const operation = store.beginRead("profile-a", "wave-a");
    expect(operation?.readThroughSerialNo).toBe(10);
    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(0);
    expect(getDmUnreadSummary(store.getSnapshot(), "profile-a").hasUnread).toBe(
      false
    );

    store.applyServerState(
      state({
        unreadCount: 0,
        firstUnreadSerialNo: null,
        latestDropSerialNo: 10,
        latestReadSerialNo: 10,
        version: 2,
      })
    );
    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
    ).toMatchObject({ unread_count: 0, latest_read_serial_no: 10, version: 2 });
  });

  it("does not create a stranded optimistic read for an already-read conversation", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({
        unreadCount: 0,
        latestDropSerialNo: 10,
        latestReadSerialNo: 10,
        version: 2,
      })
    );

    expect(store.beginRead("profile-a", "wave-a")).toBeNull();
  });

  it("accepts a newer authoritative mark-unread event that moves the read serial backward", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({
        unreadCount: 0,
        latestDropSerialNo: 12,
        latestReadSerialNo: 12,
        version: 2,
      })
    );

    store.applyServerState(
      state({
        unreadCount: 2,
        firstUnreadSerialNo: 11,
        latestDropSerialNo: 12,
        latestReadSerialNo: 10,
        version: 3,
      })
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
    ).toMatchObject({
      unread_count: 2,
      first_unread_drop_serial_no: 11,
      latest_read_serial_no: 10,
      version: 3,
    });
  });

  it("counts a new message while closed and preserves it when it races a read", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({
        unreadCount: 2,
        latestDropSerialNo: 10,
        version: 1,
      })
    );
    const operation = store.beginRead("profile-a", "wave-a");
    expect(operation).not.toBeNull();

    store.applyServerState(
      state({
        unreadCount: 3,
        latestDropSerialNo: 11,
        version: 2,
      })
    );
    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
    ).toMatchObject({
      unread_count: 1,
      first_unread_drop_serial_no: 11,
    });

    store.applyServerState(
      state({
        unreadCount: 1,
        firstUnreadSerialNo: 11,
        latestDropSerialNo: 11,
        latestReadSerialNo: 10,
        version: 3,
      })
    );
    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(1);
  });

  it("shows an immediate reply after the server has reset the unread window", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({
        unreadCount: 1,
        firstUnreadSerialNo: 9,
        latestDropSerialNo: 10,
        latestReadSerialNo: 8,
        version: 1,
      })
    );
    const operation = store.beginRead("profile-a", "wave-a");
    expect(operation?.readThroughSerialNo).toBe(10);

    store.applyServerState(
      state({
        unreadCount: 1,
        firstUnreadSerialNo: 11,
        latestDropSerialNo: 11,
        latestReadSerialNo: 9,
        version: 2,
      })
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
    ).toMatchObject({
      unread_count: 1,
      first_unread_drop_serial_no: 11,
    });
    expect(getDmUnreadSummary(store.getSnapshot(), "profile-a")).toMatchObject(
      {
        totalUnreadMessages: 1,
        unreadConversationCount: 1,
        hasUnread: true,
      }
    );
  });

  it("flags an incoming drop that is still suppressed by an optimistic read", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({
        unreadCount: 1,
        firstUnreadSerialNo: 10,
        latestDropSerialNo: 10,
        latestReadSerialNo: 9,
        version: 1,
      })
    );
    store.beginRead("profile-a", "wave-a", 10);
    store.applyServerState(
      state({
        unreadCount: 1,
        firstUnreadSerialNo: 10,
        latestDropSerialNo: 11,
        latestReadSerialNo: 9,
        version: 2,
      })
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(0);
    expect(
      store.needsIncomingDropRecovery("profile-a", "wave-a", 11)
    ).toBe(true);
  });

  it("does not recover an incoming drop whose unread count is already visible", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({ unreadCount: 1, latestDropSerialNo: 11, version: 2 })
    );

    expect(
      store.needsIncomingDropRecovery("profile-a", "wave-a", 11)
    ).toBe(false);
  });

  it("reads an open visible conversation through the incoming serial", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({ unreadCount: 0, latestDropSerialNo: 10, version: 1 })
    );

    const operation = store.beginRead("profile-a", "wave-a", 12);
    store.applyServerState(
      state({
        unreadCount: 1,
        firstUnreadSerialNo: 12,
        latestDropSerialNo: 12,
        latestReadSerialNo: 10,
        version: 2,
      })
    );

    expect(operation?.readThroughSerialNo).toBe(12);
    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(0);
  });

  it("rolls back a failed read without erasing a newer message", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({ unreadCount: 2, latestDropSerialNo: 10, version: 1 })
    );
    const operation = store.beginRead("profile-a", "wave-a");
    expect(operation).not.toBeNull();
    store.applyServerState(
      state({ unreadCount: 3, latestDropSerialNo: 11, version: 2 })
    );

    expect(store.rollbackRead(operation!)).toBe(true);
    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(3);
  });

  it("rejects duplicate and out-of-order WebSocket events", () => {
    const store = new DmUnreadStore();
    expect(store.applyServerState(state({ unreadCount: 2, version: 2 }))).toBe(
      true
    );
    expect(store.applyServerState(state({ unreadCount: 99, version: 2 }))).toBe(
      false
    );
    expect(store.applyServerState(state({ unreadCount: 88, version: 1 }))).toBe(
      false
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(2);
  });

  it("rejects a stale snapshot after a WebSocket event", () => {
    const store = new DmUnreadStore();
    const startedAtSequence = store.beginSnapshot();
    store.applyServerState(
      state({ unreadCount: 2, latestDropSerialNo: 12, version: 2 })
    );

    store.applySnapshot(
      {
        profile_id: "profile-a",
        count: 1,
        conversations: [
          state({ unreadCount: 1, latestDropSerialNo: 11, version: 1 }),
        ],
      },
      startedAtSequence
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(2);
  });

  it("treats a completed snapshot as authoritative for equal-version changes", () => {
    const store = new DmUnreadStore();
    store.applyServerState(state({ unreadCount: 2, version: 2 }));
    const startedAtSequence = store.beginSnapshot();

    store.applySnapshot(
      {
        profile_id: "profile-a",
        count: 0,
        conversations: [state({ unreadCount: 0, version: 2 })],
      },
      startedAtSequence
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(0);
  });

  it("removes conversations omitted from an authoritative snapshot", () => {
    const store = new DmUnreadStore();
    store.applyServerState(state({ unreadCount: 2, version: 2 }));
    const startedAtSequence = store.beginSnapshot();

    store.applySnapshot(
      { profile_id: "profile-a", count: 0, conversations: [] },
      startedAtSequence
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
    ).toBeNull();
  });

  it("preserves a conversation received after a snapshot request began", () => {
    const store = new DmUnreadStore();
    const startedAtSequence = store.beginSnapshot();
    store.applyServerState(state({ unreadCount: 1, version: 1 }));

    store.applySnapshot(
      { profile_id: "profile-a", count: 0, conversations: [] },
      startedAtSequence
    );

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(1);
  });

  it("preserves an explicit read-through boundary below the latest store serial", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({ unreadCount: 2, latestDropSerialNo: 12, version: 2 })
    );

    expect(
      store.beginRead("profile-a", "wave-a", 10)?.readThroughSerialNo
    ).toBe(10);
    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(2);
  });

  it("does not let a snapshot overwrite an in-flight local read", () => {
    const store = new DmUnreadStore();
    const initial = state({ unreadCount: 2, version: 1 });
    store.applyServerState(initial);
    store.beginRead("profile-a", "wave-a");
    store.applySnapshot({
      profile_id: "profile-a",
      count: 2,
      conversations: [initial],
    });

    expect(
      getDmUnreadConversation(store.getSnapshot(), "profile-a", "wave-a")
        ?.unread_count
    ).toBe(0);
  });

  it("keeps connected profiles isolated when one messages the other", () => {
    const store = new DmUnreadStore();
    store.applyServerState(
      state({ profileId: "profile-b", unreadCount: 1, version: 1 })
    );

    expect(getDmUnreadSummary(store.getSnapshot(), "profile-a")).toEqual({
      totalUnreadMessages: 0,
      unreadConversationCount: 0,
      hasUnread: false,
    });
    expect(getDmUnreadSummary(store.getSnapshot(), "profile-b")).toEqual({
      totalUnreadMessages: 1,
      unreadConversationCount: 1,
      hasUnread: true,
    });
  });

  it("clears cached state before a profile is reactivated", () => {
    const store = new DmUnreadStore();
    store.applySnapshot({
      profile_id: "profile-a",
      count: 1,
      conversations: [state({ unreadCount: 1, version: 1 })],
    });

    expect(store.resetProfile("profile-a")).toBe(true);
    expect(getDmUnreadSummary(store.getSnapshot(), "profile-a")).toEqual({
      totalUnreadMessages: 0,
      unreadConversationCount: 0,
      hasUnread: false,
    });
    expect(getDmUnreadSnapshotReady(store.getSnapshot(), "profile-a")).toBe(
      false
    );
  });
});
