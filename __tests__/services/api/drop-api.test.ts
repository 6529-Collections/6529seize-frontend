import type { ApiDrop } from "@/generated/models/ApiDrop";
import { fetchDropByIdBatched, fetchDropsByIds } from "@/services/api/drop-api";
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
