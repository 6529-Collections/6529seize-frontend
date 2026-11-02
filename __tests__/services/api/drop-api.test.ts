import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  DROP_BATCH_WINDOW_MS,
  fetchDropByIdBatched,
  fetchDropsByIds,
} from "@/services/api/drop-api";
import { fetchDropsV2ByIds } from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropsV2ByIds: jest.fn(),
}));

const fetchDropsV2ByIdsMock = fetchDropsV2ByIds as jest.Mock;

beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("fetchDropsByIds", () => {
  it("fetches drops with lean v2 drop detail hydration", async () => {
    const replyDrop = { id: "reply-1" } as ApiDrop;
    fetchDropsV2ByIdsMock.mockResolvedValue([replyDrop]);

    const result = await fetchDropsByIds(["reply-1"]);

    expect(fetchDropsV2ByIdsMock).toHaveBeenCalledTimes(1);
    expect(fetchDropsV2ByIdsMock).toHaveBeenCalledWith({
      dropIds: ["reply-1"],
      includeFullMetadata: false,
      includeTopRaters: false,
    });
    expect(result).toEqual([replyDrop]);
  });

  it("returns fetched drops in requested ID order", async () => {
    const firstDrop = { id: "drop-1" } as ApiDrop;
    const secondDrop = { id: "reply-1" } as ApiDrop;
    fetchDropsV2ByIdsMock.mockResolvedValueOnce([secondDrop, firstDrop]);

    const result = await fetchDropsByIds(["drop-1", "reply-1"]);

    expect(result).toEqual([firstDrop, secondDrop]);
  });

  it("keeps fulfilled drops when another requested id is missing", async () => {
    const validDrop = { id: "valid-drop" } as ApiDrop;
    fetchDropsV2ByIdsMock.mockResolvedValueOnce([validDrop]);

    const result = await fetchDropsByIds(["valid-drop", "deleted-drop"]);

    expect(fetchDropsV2ByIdsMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([validDrop]);
  });

  it("resolves valid batched requests when another batched id is missing", async () => {
    jest.useFakeTimers();
    const validDrop = { id: "valid-drop" } as ApiDrop;
    fetchDropsV2ByIdsMock.mockResolvedValueOnce([validDrop]);

    const validPromise = fetchDropByIdBatched("valid-drop");
    const deletedPromise = fetchDropByIdBatched("deleted-drop");
    const assertions = Promise.all([
      expect(validPromise).resolves.toBe(validDrop),
      expect(deletedPromise).rejects.toThrow("Drop deleted-drop not found"),
    ]);

    jest.runOnlyPendingTimers();

    await assertions;
    expect(fetchDropsV2ByIdsMock).toHaveBeenCalledTimes(1);
  });

  describe("fetchDropByIdBatched coalescing window", () => {
    const resolveEveryDrop = () =>
      fetchDropsV2ByIdsMock.mockImplementation(
        async ({ dropIds }: { dropIds: string[] }) =>
          dropIds.map((id) => ({ id }) as ApiDrop)
      );

    it("sends lookups made inside the window as one multi-id request", async () => {
      jest.useFakeTimers();
      resolveEveryDrop();

      const first = fetchDropByIdBatched("drop-a");
      jest.advanceTimersByTime(DROP_BATCH_WINDOW_MS - 1);
      const second = fetchDropByIdBatched("drop-b");
      const duplicate = fetchDropByIdBatched("drop-a");
      expect(fetchDropsV2ByIdsMock).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1);

      expect(fetchDropsV2ByIdsMock).toHaveBeenCalledTimes(1);
      expect(fetchDropsV2ByIdsMock).toHaveBeenCalledWith({
        dropIds: ["drop-a", "drop-b"],
        includeFullMetadata: false,
        includeTopRaters: false,
      });
      await expect(first).resolves.toEqual({ id: "drop-a" });
      await expect(second).resolves.toEqual({ id: "drop-b" });
      await expect(duplicate).resolves.toEqual({ id: "drop-a" });
    });

    it("starts a new window for lookups made after a flush", async () => {
      jest.useFakeTimers();
      resolveEveryDrop();

      const first = fetchDropByIdBatched("drop-a");
      await jest.advanceTimersByTimeAsync(DROP_BATCH_WINDOW_MS);
      const second = fetchDropByIdBatched("drop-b");
      await jest.advanceTimersByTimeAsync(DROP_BATCH_WINDOW_MS);

      await expect(Promise.all([first, second])).resolves.toEqual([
        { id: "drop-a" },
        { id: "drop-b" },
      ]);
      expect(fetchDropsV2ByIdsMock).toHaveBeenCalledTimes(2);
      expect(fetchDropsV2ByIdsMock).toHaveBeenNthCalledWith(1, {
        dropIds: ["drop-a"],
        includeFullMetadata: false,
        includeTopRaters: false,
      });
      expect(fetchDropsV2ByIdsMock).toHaveBeenNthCalledWith(2, {
        dropIds: ["drop-b"],
        includeFullMetadata: false,
        includeTopRaters: false,
      });
    });

    it("resolves each caller with its own drop and rejects only the failed chunk", async () => {
      jest.useFakeTimers();
      const dropIds = Array.from(
        { length: 101 },
        (_, index) => `drop-${index}`
      );
      const failure = new Error("chunk failed");
      fetchDropsV2ByIdsMock.mockImplementation(
        async ({ dropIds: requested }: { dropIds: string[] }) => {
          if (requested.includes("drop-100")) {
            throw failure;
          }
          return requested.map((id) => ({ id }) as ApiDrop);
        }
      );

      const results = dropIds.map((dropId) => fetchDropByIdBatched(dropId));
      const settled = Promise.allSettled(results);
      await jest.advanceTimersByTimeAsync(DROP_BATCH_WINDOW_MS);
      const outcomes = await settled;

      expect(fetchDropsV2ByIdsMock).toHaveBeenCalledTimes(2);
      expect(outcomes[0]).toEqual({
        status: "fulfilled",
        value: { id: "drop-0" },
      });
      expect(outcomes[99]).toEqual({
        status: "fulfilled",
        value: { id: "drop-99" },
      });
      expect(outcomes[100]).toEqual({ status: "rejected", reason: failure });
    });

    it("rejects a blank id without scheduling a request", async () => {
      jest.useFakeTimers();

      await expect(fetchDropByIdBatched("  ")).rejects.toThrow(
        "Cannot fetch drop without a drop id"
      );
      await jest.advanceTimersByTimeAsync(DROP_BATCH_WINDOW_MS);

      expect(fetchDropsV2ByIdsMock).not.toHaveBeenCalled();
    });
  });

  it("chunks requests above the v2 drops page size", async () => {
    const dropIds = Array.from({ length: 101 }, (_, index) => `drop-${index}`);
    fetchDropsV2ByIdsMock.mockImplementation(
      async ({ dropIds: requestedDropIds }: { dropIds: string[] }) =>
        requestedDropIds.map((id) => ({ id }) as ApiDrop)
    );

    const result = await fetchDropsByIds(dropIds);

    expect(result.map((drop) => drop.id)).toEqual(dropIds);
    expect(fetchDropsV2ByIdsMock).toHaveBeenCalledTimes(2);
    expect(fetchDropsV2ByIdsMock).toHaveBeenNthCalledWith(1, {
      dropIds: dropIds.slice(0, 100),
      includeFullMetadata: false,
      includeTopRaters: false,
    });
    expect(fetchDropsV2ByIdsMock).toHaveBeenNthCalledWith(2, {
      dropIds: dropIds.slice(100),
      includeFullMetadata: false,
      includeTopRaters: false,
    });
  });
});
