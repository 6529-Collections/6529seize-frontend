import { act, renderHook } from "@testing-library/react";
import {
  documentationFixture,
  titleOperation,
} from "@/__tests__/fixtures/artwork-documentation";
import { useDocumentationDraft } from "@/hooks/artwork-documentation/useDocumentationDraft";
import {
  activateDocumentationDraftRecovery,
  saveDocumentationDraftRecovery,
} from "@/lib/artwork-documentation/draft-recovery";
import { DocumentationDraftController } from "@/lib/artwork-documentation/draft-controller";
import {
  getDocumentationContext,
  patchDocumentationModule,
} from "@/services/api/artwork-documentation-api";

const mockWallet = "0x1111111111111111111111111111111111111111";
const actor = `artist-a:direct:${mockWallet}`;
let mockAuth = true;
let mockAddress: string | null = mockWallet;
let mockRole: string | null = null;
jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_STORAGE_KEYS: { activeAddress: "active-address" },
  AUTH_TOKEN_CHANGED_EVENT: "auth-changed",
  PROFILE_SWITCHED_EVENT: "profile-switched",
  WALLET_ACCOUNTS_UPDATED_EVENT: "wallets-changed",
  getAuthJwt: () => (mockAuth ? "test-session-presence" : null),
  getWalletAddress: () => mockAddress,
  getWalletRole: () => mockRole,
}));
jest.mock("@/services/api/artwork-documentation-api", () => ({
  documentationErrorStatus: (error: { status?: number }) => error.status,
  patchDocumentationModule: jest.fn(),
  getDocumentationContext: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  globalThis.sessionStorage.clear();
  mockAuth = true;
  mockAddress = mockWallet;
  mockRole = null;
  globalThis.dispatchEvent(new Event("profile-switched"));
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    configurable: true,
    value: jest.fn(() => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
  });
});
afterEach(() => jest.useRealTimers());

it("recovers incomplete writing after a same-document route unmount", async () => {
  const context = documentationFixture();
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit("artwork", titleOperation(""))
  );
  first.unmount();
  const reopened = renderHook(() => useDocumentationDraft(context, actor));
  await act(() => jest.advanceTimersByTimeAsync(6000));
  expect(reopened.result.current.edits[0]?.operation.answer?.value).toBe("");
  expect(reopened.result.current.state).toBe("invalid");
  expect(patchDocumentationModule).not.toHaveBeenCalled();
  reopened.unmount();
});

it.each(["draft_version", "artist_record_version"] as const)(
  "requires explicit review when canonical %s changes, including another refresh",
  async (version) => {
    const context = documentationFixture();
    const first = renderHook(() => useDocumentationDraft(context, actor));
    act(() =>
      first.result.current.controller.edit(
        "artwork",
        titleOperation("Unsaved writing")
      )
    );
    first.unmount();
    const latest = { ...context, [version]: context[version] + 1 };
    const restored = renderHook(() => useDocumentationDraft(latest, actor));
    await act(() => jest.advanceTimersByTimeAsync(6000));
    expect(restored.result.current.state).toBe("conflict");
    expect(restored.result.current.edits[0]?.operation.answer?.value).toBe(
      "Unsaved writing"
    );
    expect(patchDocumentationModule).not.toHaveBeenCalled();
    restored.unmount();
    const refreshed = renderHook(() => useDocumentationDraft(latest, actor));
    await act(() => jest.advanceTimersByTimeAsync(6000));
    expect(refreshed.result.current.state).toBe("conflict");
    expect(patchDocumentationModule).not.toHaveBeenCalled();
    refreshed.unmount();
  }
);

it("removes recovery after an acknowledged save", async () => {
  const context = documentationFixture();
  jest
    .mocked(patchDocumentationModule)
    .mockResolvedValue({ ...context, draft_version: 2 });
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit("artwork", titleOperation("Saved"))
  );
  await act(() => first.result.current.controller.flush());
  expect(first.result.current.state).toBe("clean");
  first.unmount();
  const reopened = renderHook(() => useDocumentationDraft(context, actor));
  expect(reopened.result.current.edits).toEqual([]);
  expect(patchDocumentationModule).toHaveBeenCalledTimes(1);
  reopened.unmount();
});

it("retains typing newer than a request whose response was lost and requires review", async () => {
  const context = documentationFixture();
  jest.mocked(patchDocumentationModule).mockRejectedValue(new Error("offline"));
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit(
      "artwork",
      titleOperation("First write")
    )
  );
  await act(() => first.result.current.controller.flush());
  act(() =>
    first.result.current.controller.edit(
      "artwork",
      titleOperation("Later writing")
    )
  );
  first.unmount();
  jest.mocked(patchDocumentationModule).mockClear();
  const latest = { ...context, draft_version: 2 };
  const reopened = renderHook(() => useDocumentationDraft(latest, actor));
  await act(() => jest.advanceTimersByTimeAsync(6000));
  expect(reopened.result.current.state).toBe("conflict");
  expect(reopened.result.current.edits[0]?.operation.answer?.value).toBe(
    "Later writing"
  );
  expect(patchDocumentationModule).not.toHaveBeenCalled();
  reopened.unmount();
});

it.each(["profile-switched", "auth-changed"])(
  "clears old answers on %s after leaving the editor",
  (event) => {
    const context = documentationFixture();
    const first = renderHook(() => useDocumentationDraft(context, actor));
    act(() =>
      first.result.current.controller.edit(
        "artwork",
        titleOperation("Private draft")
      )
    );
    first.unmount();
    mockAuth = event !== "auth-changed";
    globalThis.dispatchEvent(new Event(event));
    mockAuth = true;
    const reopened = renderHook(() => useDocumentationDraft(context, actor));
    expect(reopened.result.current.edits).toEqual([]);
    expect(patchDocumentationModule).not.toHaveBeenCalled();
    reopened.unmount();
  }
);

it("clears recovery on an actor switch and rejects the old mounted controller's late write", () => {
  const context = documentationFixture();
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit(
      "artwork",
      titleOperation("Private draft")
    )
  );
  const other = renderHook(() =>
    useDocumentationDraft(context, "other:proxy:wallet")
  );
  first.unmount();
  other.unmount();
  const reopened = renderHook(() => useDocumentationDraft(context, actor));
  expect(reopened.result.current.edits).toEqual([]);
  reopened.unmount();
});

it("keeps unsaved answers in memory when storage is denied and reports recovery unavailable", () => {
  const context = documentationFixture();
  const setItem = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage denied");
    });
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit(
      "artwork",
      titleOperation("Still in memory")
    )
  );
  expect(first.result.current.edits[0]?.operation.answer?.value).toBe(
    "Still in memory"
  );
  expect(first.result.current.recoveryUnavailable).toBe(true);
  first.unmount();
  setItem.mockRestore();
});

it("does not discard drafts during React StrictMode effect replay", async () => {
  const context = documentationFixture();
  const pending = new DocumentationDraftController(
    context,
    { save: jest.fn(), read: jest.fn() },
    jest.fn()
  );
  pending.edit("artwork", titleOperation(""));
  activateDocumentationDraftRecovery(actor);
  saveDocumentationDraftRecovery(actor, pending.snapshot());
  pending.dispose();
  const { StrictMode } = await import("react");
  const restored = renderHook(() => useDocumentationDraft(context, actor), {
    wrapper: StrictMode,
  });
  await act(() => jest.advanceTimersByTimeAsync(6000));
  expect(restored.result.current.edits[0]?.operation.answer?.value).toBe("");
  expect(restored.result.current.state).toBe("invalid");
  restored.unmount();
});

it("allows explicit discard of recovered conflicting edits", async () => {
  const context = documentationFixture();
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit(
      "artwork",
      titleOperation("Old local version")
    )
  );
  first.unmount();
  const latest = { ...context, draft_version: 2 };
  jest.mocked(getDocumentationContext).mockResolvedValue(latest);
  const restored = renderHook(() => useDocumentationDraft(latest, actor));
  await act(() => restored.result.current.controller.resolveConflict(false));
  expect(restored.result.current.edits).toEqual([]);
  expect(restored.result.current.state).toBe("clean");
  restored.unmount();
  const reopened = renderHook(() => useDocumentationDraft(latest, actor));
  expect(reopened.result.current.edits).toEqual([]);
  reopened.unmount();
});

it.each(["wallet", "proxy"])(
  "clears recovery after an unmounted %s identity change",
  (scope) => {
    const context = documentationFixture();
    const first = renderHook(() => useDocumentationDraft(context, actor));
    act(() =>
      first.result.current.controller.edit(
        "artwork",
        titleOperation("Private draft")
      )
    );
    first.unmount();
    if (scope === "wallet")
      mockAddress = "0x2222222222222222222222222222222222222222";
    else mockRole = "other-proxy";
    globalThis.dispatchEvent(new Event("wallets-changed"));
    mockAddress = mockWallet;
    mockRole = null;
    const reopened = renderHook(() => useDocumentationDraft(context, actor));
    expect(reopened.result.current.edits).toEqual([]);
    reopened.unmount();
  }
);

it("keeps pending writing across a token refresh for the same actor", async () => {
  const context = documentationFixture();
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit("artwork", titleOperation(""))
  );
  first.unmount();
  globalThis.dispatchEvent(new Event("auth-changed"));
  const reopened = renderHook(() => useDocumentationDraft(context, actor));
  await act(() => jest.advanceTimersByTimeAsync(6000));
  expect(reopened.result.current.edits[0]?.operation.answer?.value).toBe("");
  reopened.unmount();
});
