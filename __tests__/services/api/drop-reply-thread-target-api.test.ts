import { fetchDropReplyThreadTarget } from "@/services/api/drop-reply-thread-target-api";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.Mock;

describe("fetchDropReplyThreadTarget", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("resolves a reply to the drop it answers", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [{ id: "reply", reply_to_drop: { id: "parent", serial_no: 41 } }],
    });

    await expect(fetchDropReplyThreadTarget({ serialNo: 42 })).resolves.toEqual(
      { parentDropId: "parent", parentSerialNo: 41 }
    );
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops",
        params: { serial_nos: "42", page_size: "1" },
      })
    );
  });

  it("returns null for top-level drops", async () => {
    commonApiFetchMock.mockResolvedValueOnce({ data: [{ id: "root" }] });
    await expect(
      fetchDropReplyThreadTarget({ serialNo: 41 })
    ).resolves.toBeNull();
  });

  it("returns null for unknown serials", async () => {
    commonApiFetchMock.mockResolvedValueOnce({ data: [] });
    await expect(
      fetchDropReplyThreadTarget({ serialNo: 999 })
    ).resolves.toBeNull();
  });
});
