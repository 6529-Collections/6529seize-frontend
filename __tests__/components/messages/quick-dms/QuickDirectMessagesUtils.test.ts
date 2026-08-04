import {
  CLOSED_STATE,
  QUICK_DM_STORAGE_KEY,
  parseStoredState,
  readStoredState,
  storeState,
} from "@/components/messages/quick-dms/QuickDirectMessagesUtils";

describe("QuickDirectMessagesUtils storage", () => {
  beforeEach(() => {
    globalThis.window.localStorage.clear();
  });

  it("restores quick-chat state only for the identity that stored it", () => {
    const identityKey = "0xabc:profile:profile-1:primary";
    const chatState = { view: "chat", waveId: "wave-1" } as const;

    storeState(chatState, identityKey);

    expect(readStoredState(identityKey)).toEqual(chatState);
    expect(readStoredState("0xabc:profile:profile-2:primary")).toEqual(
      CLOSED_STATE
    );
  });

  it("does not restore legacy unscoped quick-chat state", () => {
    const legacyState = JSON.stringify({ view: "chat", waveId: "wave-1" });

    globalThis.window.localStorage.setItem(QUICK_DM_STORAGE_KEY, legacyState);

    expect(readStoredState("0xabc:profile:profile-1:primary")).toEqual(
      CLOSED_STATE
    );
  });

  it("ignores a storage update written by another identity", () => {
    const otherIdentityState = JSON.stringify({
      identityKey: "0xabc:profile:profile-2:primary",
      state: { view: "chat", waveId: "wave-2" },
      version: 1,
    });

    expect(
      parseStoredState(otherIdentityState, "0xabc:profile:profile-1:primary")
    ).toBeNull();
  });

  it("clears persisted state when there is no active identity", () => {
    storeState(
      { view: "chat", waveId: "wave-1" },
      "0xabc:profile:profile-1:primary"
    );

    storeState(CLOSED_STATE, null);

    expect(
      globalThis.window.localStorage.getItem(QUICK_DM_STORAGE_KEY)
    ).toBeNull();
  });
});
