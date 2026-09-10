import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { reconcileDropReaction } from "@/helpers/reactions/reconcileDropReaction";
import { fetchDropByIdBatched } from "@/services/api/drop-api";

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn(),
}));
const fetchDrop = jest.mocked(fetchDropByIdBatched);
const canonical = (reaction: string | null) =>
  ({
    id: "drop-1",
    context_profile_context: { reaction },
    reactions: [],
  }) as unknown as ApiDrop;
const reconcile = (intendedReaction: string | null, isCurrent = () => true) =>
  reconcileDropReaction({ dropId: "drop-1", intendedReaction, isCurrent });

describe("reconcileDropReaction", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchDrop.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  it.each([":smile:", ":wave:", null])(
    "confirms saved intent %s on the first read",
    async (reaction) => {
      const drop = canonical(reaction);
      fetchDrop.mockResolvedValue(drop);
      await expect(reconcile(reaction)).resolves.toEqual({
        outcome: "confirmed",
        drop,
      });
      expect(fetchDrop).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    }
  );

  it("does not treat an old replica response as failure", async () => {
    fetchDrop
      .mockResolvedValueOnce(canonical(null))
      .mockResolvedValue(canonical(":smile:"));
    const result = reconcile(":smile:");
    await jest.advanceTimersByTimeAsync(999);
    expect(fetchDrop).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual({
      outcome: "confirmed",
      drop: canonical(":smile:"),
    });
  });

  it("returns the latest observed state without claiming the write failed", async () => {
    fetchDrop.mockResolvedValue(canonical(null));
    const result = reconcile(":smile:");
    await jest.advanceTimersByTimeAsync(3_000);
    await expect(result).resolves.toEqual({
      outcome: "unconfirmed",
      drop: canonical(null),
    });
    expect(fetchDrop).toHaveBeenCalledTimes(3);
  });

  it("bounds rejected and stalled canonical reads and ignores late results", async () => {
    const late = createDeferredPromise<ApiDrop>();
    fetchDrop
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockReturnValue(late.promise);
    const result = reconcile(":smile:");
    await jest.advanceTimersByTimeAsync(9_000);
    await expect(result).resolves.toEqual({
      outcome: "unconfirmed",
      drop: null,
    });
    late.resolve(canonical(":smile:"));
    expect(fetchDrop).toHaveBeenCalledTimes(3);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("cannot confirm removal from a missing viewer context or the wrong drop", async () => {
    fetchDrop
      .mockResolvedValueOnce({ id: "drop-1" } as ApiDrop)
      .mockResolvedValue({ ...canonical(null), id: "drop-2" });
    const result = reconcile(null);
    await jest.advanceTimersByTimeAsync(3_000);
    await expect(result).resolves.toEqual({
      outcome: "unconfirmed",
      drop: null,
    });
  });

  it.each([undefined, null, {}])(
    "does not apply a partial drop with invalid reactions %s",
    async (reactions) => {
      fetchDrop.mockResolvedValue({
        ...canonical(":smile:"),
        reactions,
      } as unknown as ApiDrop);
      const result = reconcile(":smile:");
      await jest.advanceTimersByTimeAsync(3_000);
      await expect(result).resolves.toEqual({
        outcome: "unconfirmed",
        drop: null,
      });
    }
  );

  it("discards an in-flight read once a newer intent owns the drop", async () => {
    const late = createDeferredPromise<ApiDrop>();
    let current = true;
    fetchDrop.mockReturnValue(late.promise);
    const result = reconcile(":smile:", () => current);
    current = false;
    late.resolve(canonical(":smile:"));
    await expect(result).resolves.toEqual({
      outcome: "superseded",
      drop: null,
    });
  });

  it("preserves a matching websocket update over a late mismatching read", async () => {
    const late = createDeferredPromise<ApiDrop>();
    let confirmed = false;
    fetchDrop.mockReturnValue(late.promise);
    const result = reconcileDropReaction({
      dropId: "drop-1",
      intendedReaction: ":smile:",
      isCurrent: () => true,
      isConfirmed: () => confirmed,
    });
    confirmed = true;
    late.resolve(canonical(null));
    await expect(result).resolves.toEqual({ outcome: "confirmed", drop: null });
    expect(fetchDrop).toHaveBeenCalledTimes(1);
  });
});
