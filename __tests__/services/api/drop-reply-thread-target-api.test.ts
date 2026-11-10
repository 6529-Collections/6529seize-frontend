import { fetchDropReplyThreadTarget } from "@/services/api/drop-reply-thread-target-api";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = jest.mocked(commonApiFetch);
const wave = { id: "wave" };
const linkedReply = {
  id: "reply",
  wave,
  reply_to_drop: { id: "parent", serial_no: 41 },
};
const root = { id: "root", serial_no: 30 };

describe("fetchDropReplyThreadTarget", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it.each([true, false])(
    "uses the canonical root with wave collapse %s",
    async (collapseAll) => {
      commonApiFetchMock.mockResolvedValueOnce({
        data: [{ ...linkedReply, collapsed_reply_thread: root }],
      });

      await expect(
        fetchDropReplyThreadTarget({
          waveId: wave.id,
          serialNo: 42,
          collapseAll,
        })
      ).resolves.toEqual({
        parentDropId: root.id,
        parentSerialNo: root.serial_no,
        replySerialNo: 42,
      });
      expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
      expect(commonApiFetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "v2/drops",
          params: { serial_nos: "42", page_size: "1" },
        })
      );
    }
  );

  it("follows nested reply ancestry on older wave-wide APIs", async () => {
    commonApiFetchMock
      .mockResolvedValueOnce({ data: [linkedReply] })
      .mockResolvedValueOnce({
        data: [{ id: "parent", wave, reply_to_drop: root }],
      })
      .mockResolvedValueOnce({ data: [{ ...root, wave }] });

    await expect(
      fetchDropReplyThreadTarget({ waveId: wave.id, serialNo: 42 })
    ).resolves.toEqual({
      parentDropId: root.id,
      parentSerialNo: root.serial_no,
      replySerialNo: 42,
    });
    expect(commonApiFetchMock).toHaveBeenCalledTimes(3);
  });

  it("leaves an ordinary inline reply in the timeline", async () => {
    commonApiFetchMock.mockResolvedValueOnce({ data: [linkedReply] });
    await expect(
      fetchDropReplyThreadTarget({
        waveId: wave.id,
        serialNo: 42,
        collapseAll: false,
      })
    ).resolves.toBeNull();
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null for top-level drops, other waves and unknown serials", async () => {
    commonApiFetchMock
      .mockResolvedValueOnce({ data: [{ ...root, wave }] })
      .mockResolvedValueOnce({
        data: [
          {
            ...linkedReply,
            wave: { id: "other" },
            collapsed_reply_thread: root,
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] });
    for (const serialNo of [30, 42, 999]) {
      await expect(
        fetchDropReplyThreadTarget({ waveId: wave.id, serialNo })
      ).resolves.toBeNull();
    }
  });
});
