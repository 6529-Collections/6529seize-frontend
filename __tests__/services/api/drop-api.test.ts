import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchDropsByIds } from "@/services/api/drop-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("fetchDropsByIds", () => {
  it("includes reply drops in batched ID lookups", async () => {
    const replyDrop = { id: "reply-1" } as ApiDrop;
    commonApiFetchMock.mockResolvedValue([replyDrop]);

    const result = await fetchDropsByIds(["reply-1"]);

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "drops",
      params: {
        ids: "reply-1",
        limit: "1",
        include_replies: "true",
      },
    });
    expect(result).toEqual([replyDrop]);
  });

  it("returns fetched drops in requested ID order", async () => {
    const firstDrop = { id: "drop-1" } as ApiDrop;
    const secondDrop = { id: "reply-1" } as ApiDrop;
    commonApiFetchMock.mockResolvedValue([secondDrop, firstDrop]);

    const result = await fetchDropsByIds(["drop-1", "reply-1"]);

    expect(result).toEqual([firstDrop, secondDrop]);
  });
});
