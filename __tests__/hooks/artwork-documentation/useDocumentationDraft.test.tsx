import cloneDeep from "lodash/cloneDeep";
import { act, renderHook } from "@testing-library/react";
import type { ApiArtworkDocumentationContext } from "@/generated/models/ApiArtworkDocumentationContext";
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
    if (!mockAuth) mockAddress = null;
    globalThis.dispatchEvent(new Event(event));
    mockAuth = true;
    mockAddress = mockWallet;
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

it("keeps pending writing through temporary same-account session invalidation and renewal", async () => {
  const context = documentationFixture();
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit("artwork", titleOperation(""))
  );
  first.unmount();
  mockAuth = false;
  globalThis.dispatchEvent(new Event("auth-changed"));
  globalThis.dispatchEvent(new Event("wallets-changed"));
  mockAuth = true;
  globalThis.dispatchEvent(new Event("auth-changed"));
  const reopened = renderHook(() => useDocumentationDraft(context, actor));
  await act(() => jest.advanceTimersByTimeAsync(6000));
  expect(reopened.result.current.edits[0]?.operation.answer?.value).toBe("");
  expect(patchDocumentationModule).not.toHaveBeenCalled();
  reopened.unmount();
});

it("clears recovery when the authenticated account disappears without a profile-switch event", () => {
  const context = documentationFixture();
  const first = renderHook(() => useDocumentationDraft(context, actor));
  act(() =>
    first.result.current.controller.edit(
      "artwork",
      titleOperation("Private draft")
    )
  );
  first.unmount();
  // getWalletAddress reads the authenticated account, not the physical connector.
  mockAddress = null;
  mockAuth = false;
  globalThis.dispatchEvent(new Event("wallets-changed"));
  mockAddress = mockWallet;
  mockAuth = true;
  const reopened = renderHook(() => useDocumentationDraft(context, actor));
  expect(reopened.result.current.edits).toEqual([]);
  reopened.unmount();
});

describe("incoming canonical context reconciliation", () => {
  let deniedStorage: jest.SpyInstance;

  beforeEach(() => {
    jest.mocked(patchDocumentationModule).mockReset();
    jest.mocked(getDocumentationContext).mockReset();
    deniedStorage = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("Storage denied");
      });
  });
  afterEach(() => deniedStorage.mockRestore());

  it.each(["incomplete", "server-rejected"])(
    "retains a %s answer and its rejection state through equivalent parent rerenders without storage",
    async (kind) => {
      const context = documentationFixture();
      jest.mocked(patchDocumentationModule).mockRejectedValue({ status: 422 });
      const hook = renderHook(
        ({ initial }) => useDocumentationDraft(initial, actor),
        {
          initialProps: { initial: context },
        }
      );
      const controller = hook.result.current.controller;
      act(() =>
        controller.edit(
          "artwork",
          titleOperation(kind === "incomplete" ? "" : "Rejected writing")
        )
      );
      await act(() => controller.flush());
      const before = controller.snapshot();
      const requests = jest.mocked(patchDocumentationModule).mock.calls.length;
      hook.rerender({ initial: cloneDeep(context) });
      await act(() => jest.advanceTimersByTimeAsync(6000));
      expect(hook.result.current.controller).toBe(controller);
      expect(hook.result.current.edits).toEqual(before.edits);
      expect(hook.result.current.rejectedEdits).toEqual(before.rejectedEdits);
      expect(hook.result.current.state).toBe("invalid");
      expect(patchDocumentationModule).toHaveBeenCalledTimes(requests);
      expect(hook.result.current.recoveryUnavailable).toBe(true);
      hook.unmount();
    }
  );

  it("keeps an in-flight save and subsequent typing through an equivalent rerender", async () => {
    const context = documentationFixture();
    let resolve!: (value: ApiArtworkDocumentationContext) => void;
    jest
      .mocked(patchDocumentationModule)
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          })
      )
      .mockResolvedValueOnce({ ...context, draft_version: 3 });
    const hook = renderHook(
      ({ initial }) => useDocumentationDraft(initial, actor),
      {
        initialProps: { initial: context },
      }
    );
    const controller = hook.result.current.controller;
    act(() => controller.edit("artwork", titleOperation("First write")));
    let saving!: Promise<boolean>;
    act(() => {
      saving = controller.flush();
    });
    act(() => controller.edit("artwork", titleOperation("Later typing")));
    const signal = jest.mocked(patchDocumentationModule).mock.calls[0]![4];
    hook.rerender({ initial: cloneDeep(context) });
    expect(signal?.aborted).toBe(false);
    expect(hook.result.current.controller).toBe(controller);
    expect(hook.result.current.edits[0]?.operation.answer?.value).toBe(
      "Later typing"
    );
    await act(async () => {
      resolve({ ...context, draft_version: 2 });
      await saving;
    });
    expect(patchDocumentationModule).toHaveBeenCalledTimes(2);
    expect(
      jest.mocked(patchDocumentationModule).mock.calls[1]![0].draft_version
    ).toBe(2);
    expect(
      jest.mocked(patchDocumentationModule).mock.calls[1]![2][0]?.answer?.value
    ).toBe("Later typing");
    expect(hook.result.current.state).toBe("clean");
    hook.rerender({ initial: cloneDeep(context) });
    expect(hook.result.current.context.draft_version).toBe(3);
    hook.unmount();
  });

  it.each(["draft_version", "artist_record_version"] as const)(
    "retains pending writing and requires review when an incoming %s advances",
    async (version) => {
      const context = documentationFixture();
      const latest = { ...context, [version]: context[version] + 1 };
      const hook = renderHook(
        ({ initial }) => useDocumentationDraft(initial, actor),
        {
          initialProps: { initial: context },
        }
      );
      const controller = hook.result.current.controller;
      act(() => controller.edit("artwork", titleOperation("Pending writing")));
      hook.rerender({ initial: latest });
      await act(() => jest.advanceTimersByTimeAsync(6000));
      expect(hook.result.current.controller).toBe(controller);
      expect(hook.result.current.state).toBe("conflict");
      expect(hook.result.current.latest).toEqual(latest);
      expect(hook.result.current.edits[0]?.operation.answer?.value).toBe(
        "Pending writing"
      );
      expect(patchDocumentationModule).not.toHaveBeenCalled();
      hook.rerender({ initial: cloneDeep(context) });
      expect(hook.result.current.latest).toEqual(latest);
      jest.mocked(getDocumentationContext).mockResolvedValue(latest);
      jest.mocked(patchDocumentationModule).mockResolvedValue({
        ...latest,
        draft_version: latest.draft_version + 1,
      });
      await act(() => controller.resolveConflict(true));
      expect(jest.mocked(patchDocumentationModule).mock.calls[0]![0]).toEqual(
        latest
      );
      expect(hook.result.current.state).toBe("clean");
      hook.unmount();
    }
  );

  it("adopts same-version capability changes and stops pending work without dropping it", async () => {
    const context = documentationFixture();
    const restricted = {
      ...context,
      mutation_capabilities: {
        ...context.mutation_capabilities,
        edit_modules: [],
      },
    };
    const hook = renderHook(
      ({ initial }) => useDocumentationDraft(initial, actor),
      {
        initialProps: { initial: context },
      }
    );
    act(() =>
      hook.result.current.controller.edit(
        "artwork",
        titleOperation("Pending writing")
      )
    );
    hook.rerender({ initial: restricted });
    await act(() => jest.advanceTimersByTimeAsync(6000));
    expect(
      hook.result.current.context.mutation_capabilities.edit_modules
    ).toEqual([]);
    expect(hook.result.current.state).toBe("conflict");
    expect(hook.result.current.edits[0]?.operation.answer?.value).toBe(
      "Pending writing"
    );
    expect(patchDocumentationModule).not.toHaveBeenCalled();
    hook.unmount();
  });

  it("rejects a late save response after newer canonical data changes capabilities", async () => {
    const context = documentationFixture();
    let resolve!: (value: ApiArtworkDocumentationContext) => void;
    jest.mocked(patchDocumentationModule).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const hook = renderHook(
      ({ initial }) => useDocumentationDraft(initial, actor),
      {
        initialProps: { initial: context },
      }
    );
    const controller = hook.result.current.controller;
    act(() => controller.edit("artwork", titleOperation("In-flight writing")));
    let saving!: Promise<boolean>;
    act(() => {
      saving = controller.flush();
    });
    const signal = jest.mocked(patchDocumentationModule).mock.calls[0]![4];
    const latest = {
      ...context,
      draft_version: 3,
      mutation_capabilities: {
        ...context.mutation_capabilities,
        edit_modules: [],
      },
    };
    hook.rerender({ initial: latest });
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      resolve({ ...context, draft_version: 2 });
      await saving;
    });
    expect(hook.result.current.context).toEqual(latest);
    expect(hook.result.current.state).toBe("conflict");
    expect(hook.result.current.edits[0]?.operation.answer?.value).toBe(
      "In-flight writing"
    );
    expect(patchDocumentationModule).toHaveBeenCalledTimes(1);
    hook.unmount();
  });

  it("adopts a newer clean snapshot and same-version profile changes without replacing the controller", () => {
    const context = documentationFixture();
    const hook = renderHook(
      ({ initial }) => useDocumentationDraft(initial, actor),
      {
        initialProps: { initial: context },
      }
    );
    const controller = hook.result.current.controller;
    const latest = {
      ...context,
      draft_version: 2,
      profile: { ...context.profile, guidance_version: "updated-guidance" },
    };
    hook.rerender({ initial: latest });
    expect(hook.result.current.controller).toBe(controller);
    expect(hook.result.current.context).toEqual(latest);
    expect(hook.result.current.state).toBe("clean");
    const revised = {
      ...latest,
      profile: { ...latest.profile, guidance_version: "revised-guidance" },
    };
    hook.rerender({ initial: revised });
    expect(hook.result.current.context.profile.guidance_version).toBe(
      "revised-guidance"
    );
    const restricted = {
      ...revised,
      mutation_capabilities: {
        ...revised.mutation_capabilities,
        edit_modules: [],
      },
    };
    hook.rerender({ initial: restricted });
    expect(
      hook.result.current.context.mutation_capabilities.edit_modules
    ).toEqual([]);
    expect(hook.result.current.state).toBe("clean");
    hook.unmount();
  });

  it.each(["actor", "context"])(
    "isolates an incoming %s switch and cancels the old request",
    async (scope) => {
      const context = documentationFixture();
      let resolve!: (value: ApiArtworkDocumentationContext) => void;
      jest.mocked(patchDocumentationModule).mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          })
      );
      const hook = renderHook(
        ({ initial, actorKey }) => useDocumentationDraft(initial, actorKey),
        {
          initialProps: { initial: context, actorKey: actor },
        }
      );
      const previous = hook.result.current.controller;
      act(() =>
        previous.edit("artwork", titleOperation("Other record writing"))
      );
      let saving!: Promise<boolean>;
      act(() => {
        saving = previous.flush();
      });
      const signal = jest.mocked(patchDocumentationModule).mock.calls[0]![4];
      const next =
        scope === "context"
          ? { ...context, id: "33333333-3333-4333-8333-333333333333" }
          : context;
      hook.rerender({
        initial: next,
        actorKey: scope === "actor" ? "another:direct:wallet" : actor,
      });
      expect(hook.result.current.controller).not.toBe(previous);
      expect(signal?.aborted).toBe(true);
      expect(hook.result.current.edits).toEqual([]);
      await act(async () => {
        resolve({ ...context, draft_version: 2 });
        await saving;
      });
      expect(hook.result.current.context).toEqual(next);
      expect(hook.result.current.edits).toEqual([]);
      hook.unmount();
    }
  );

  it("retains queued content through a new canonical version and replays only after review", async () => {
    const context = documentationFixture();
    const latest = { ...context, draft_version: 2 };
    const saveContent = jest
      .fn()
      .mockResolvedValue({ ...latest, draft_version: 3 });
    const hook = renderHook(
      ({ initial }) => useDocumentationDraft(initial, actor),
      {
        initialProps: { initial: context },
      }
    );
    act(() =>
      hook.result.current.controller.queueContent(
        "asset-caption",
        "Pending caption",
        saveContent
      )
    );
    hook.rerender({ initial: latest });
    await act(() => jest.advanceTimersByTimeAsync(6000));
    expect(hook.result.current.state).toBe("conflict");
    expect(hook.result.current.contentEdits).toEqual([
      { id: "asset-caption", value: "Pending caption" },
    ]);
    expect(saveContent).not.toHaveBeenCalled();
    jest.mocked(getDocumentationContext).mockResolvedValue(latest);
    await act(() => hook.result.current.controller.resolveConflict(true));
    expect(saveContent).toHaveBeenCalledWith(
      latest,
      expect.any(String),
      expect.any(AbortSignal)
    );
    expect(hook.result.current.contentEdits).toEqual([]);
    expect(hook.result.current.context.draft_version).toBe(3);
    hook.unmount();
  });

  it("does not accept a late nonqueued mutation response after newer readback", async () => {
    const context = documentationFixture();
    let resolve!: (value: ApiArtworkDocumentationContext) => void;
    let signal!: AbortSignal;
    const mutate = jest.fn(
      (_: ApiArtworkDocumentationContext, abort: AbortSignal) => {
        signal = abort;
        return new Promise<ApiArtworkDocumentationContext>((done) => {
          resolve = done;
        });
      }
    );
    const hook = renderHook(
      ({ initial }) => useDocumentationDraft(initial, actor),
      {
        initialProps: { initial: context },
      }
    );
    let saving!: Promise<boolean>;
    await act(async () => {
      saving = hook.result.current.controller.mutateContent(mutate);
    });
    const latest = { ...context, draft_version: 3 };
    hook.rerender({ initial: latest });
    expect(signal.aborted).toBe(true);
    expect(hook.result.current.state).toBe("conflict");
    await act(async () => {
      resolve({ ...context, draft_version: 2 });
      await saving;
    });
    expect(hook.result.current.context).toEqual(latest);
    expect(hook.result.current.latest).toEqual(latest);
    expect(mutate).toHaveBeenCalledTimes(1);
    hook.unmount();
  });
});
