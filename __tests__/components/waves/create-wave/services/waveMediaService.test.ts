import { generateDropPart } from "@/components/waves/create-wave/services/waveMediaService";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";

jest.mock("@/components/waves/create-wave/services/multiPartUpload");

const mockFile = (name: string) =>
  new File(["content"], name, { type: "text/plain" });

describe("generateDropPart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (multiPartUpload as jest.Mock).mockImplementation(({ file }) =>
      Promise.resolve({ url: `url-${file.name}`, mime_type: file.type })
    );
  });

  it("uploads all media and returns new part", async () => {
    const part = {
      content: "c",
      quoted_drop: null,
      media: [mockFile("a.txt"), mockFile("b.txt")],
    };
    const result = await generateDropPart(part, ApiMediaUploadPurpose.Chat);
    expect(result.media).toEqual([
      { url: "url-a.txt", mime_type: "text/plain" },
      { url: "url-b.txt", mime_type: "text/plain" },
    ]);
    expect(result.content).toBe("c");
  });

  it.each([ApiMediaUploadPurpose.Chat, ApiMediaUploadPurpose.DecisionEntry])(
    "uploads every media file with the %s purpose",
    async (purpose) => {
      const part = {
        content: "c",
        quoted_drop: null,
        media: [mockFile("a.txt"), mockFile("b.txt")],
      };
      await generateDropPart(part, purpose);
      expect(multiPartUpload).toHaveBeenCalledTimes(2);
      for (const [params] of (multiPartUpload as jest.Mock).mock.calls) {
        expect(params).toEqual(
          expect.objectContaining({ path: "drop", purpose })
        );
      }
    }
  );
});
