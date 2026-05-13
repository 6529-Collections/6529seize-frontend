import type { ApiDrop } from "@/generated/models/ApiDrop";
import { fetchDropByIdBatched, fetchDropsByIds } from "@/services/api/drop-api";
import { fetchDropV2ById } from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchDropV2ById: jest.fn(),
}));

const fetchDropV2ByIdMock = fetchDropV2ById as jest.Mock;

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
    fetchDropV2ByIdMock.mockResolvedValue(replyDrop);

    const result = await fetchDropsByIds(["reply-1"]);

    expect(fetchDropV2ByIdMock).toHaveBeenCalledTimes(1);
    expect(fetchDropV2ByIdMock).toHaveBeenCalledWith("reply-1", undefined, {
      includeFullMetadata: false,
      includeTopRaters: false,
    });
    expect(result).toEqual([replyDrop]);
  });

  it("returns fetched drops in requested ID order", async () => {
    const firstDrop = { id: "drop-1" } as ApiDrop;
    const secondDrop = { id: "reply-1" } as ApiDrop;
    fetchDropV2ByIdMock
      .mockResolvedValueOnce(firstDrop)
      .mockResolvedValueOnce(secondDrop);

    const result = await fetchDropsByIds(["drop-1", "reply-1"]);

    expect(result).toEqual([firstDrop, secondDrop]);
  });

  it("keeps fulfilled drops when another drop request fails", async () => {
    const validDrop = { id: "valid-drop" } as ApiDrop;
    fetchDropV2ByIdMock
      .mockResolvedValueOnce(validDrop)
      .mockRejectedValueOnce(new Error("Drop deleted"));

    const result = await fetchDropsByIds(["valid-drop", "deleted-drop"]);

    expect(fetchDropV2ByIdMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual([validDrop]);
  });

  it("resolves valid batched requests when another batched id fails", async () => {
    jest.useFakeTimers();
    const validDrop = { id: "valid-drop" } as ApiDrop;
    const deletedDropError = new Error("Drop deleted");
    fetchDropV2ByIdMock.mockImplementation(async (dropId: string) => {
      if (dropId === "valid-drop") {
        return validDrop;
      }
      throw deletedDropError;
    });

    const validPromise = fetchDropByIdBatched("valid-drop");
    const deletedPromise = fetchDropByIdBatched("deleted-drop");
    const assertions = Promise.all([
      expect(validPromise).resolves.toBe(validDrop),
      expect(deletedPromise).rejects.toBe(deletedDropError),
    ]);

    jest.runOnlyPendingTimers();

    await assertions;
    expect(fetchDropV2ByIdMock).toHaveBeenCalledTimes(2);
  });
});
