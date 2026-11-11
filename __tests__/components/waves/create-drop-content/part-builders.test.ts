import { generateParts } from "@/components/waves/create-drop-content/part-builders";
import {
  multiPartAttachmentUpload,
  multiPartUpload,
} from "@/components/waves/create-wave/services/multiPartUpload";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { ImageProcessingError } from "@/services/uploads/ImageProcessingError";

jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(),
  multiPartAttachmentUpload: jest.fn(),
}));

const photo = (name: string) =>
  new File(["jpeg"], name, { type: "image/jpeg" });

describe("generateParts media purpose", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(multiPartUpload).mockImplementation(async ({ file }) => ({
      url: `https://cdn.example/${file.name}`,
      mime_type: "image/jpeg",
    }));
  });

  it.each([ApiMediaUploadPurpose.Chat, ApiMediaUploadPurpose.DecisionEntry])(
    "uploads every part's media with the %s purpose",
    async (purpose) => {
      const parts = [
        { content: "one", quoted_drop: null, media: [photo("a.jpg")] },
        { content: "two", quoted_drop: null, media: [photo("b.jpg")] },
      ];

      const generated = await generateParts(parts, jest.fn(), purpose);

      expect(generated.map((part) => part.media[0]?.url)).toEqual([
        "https://cdn.example/a.jpg",
        "https://cdn.example/b.jpg",
      ]);
      expect(multiPartUpload).toHaveBeenCalledTimes(2);
      for (const [params] of jest.mocked(multiPartUpload).mock.calls) {
        expect(params).toEqual(
          expect.objectContaining({ path: "drop", purpose, waitForReady: true })
        );
      }
      expect(multiPartAttachmentUpload).not.toHaveBeenCalled();
    }
  );

  it("preserves the actionable processing rejection instead of building a drop", async () => {
    const error = new ImageProcessingError(
      "This image is too large to process. Reduce its dimensions and upload again."
    );
    jest.mocked(multiPartUpload).mockRejectedValueOnce(error);
    await expect(
      generateParts(
        [
          {
            content: "keep this draft",
            quoted_drop: null,
            media: [photo("large.jpg")],
          },
        ],
        jest.fn(),
        ApiMediaUploadPurpose.Chat
      )
    ).rejects.toBe(error);
  });

  it("retains asynchronous video posting", async () => {
    const video = new File(["video"], "movie.mp4", { type: "video/mp4" });
    await generateParts(
      [{ content: "video", quoted_drop: null, media: [video] }],
      jest.fn(),
      ApiMediaUploadPurpose.Chat
    );
    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({ file: video, waitForReady: false })
    );
  });
});
