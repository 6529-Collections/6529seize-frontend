import { generateParts } from "@/components/waves/create-drop-content/part-builders";
import {
  multiPartAttachmentUpload,
  multiPartUpload,
} from "@/components/waves/create-wave/services/multiPartUpload";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { ImageProcessingError } from "@/services/uploads/ImageProcessingError";
import { MediaUploadRefusedError } from "@/services/uploads/MediaUploadRefusedError";

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

  it.each(["media", "attachment"] as const)(
    "keeps the upload-limit message for a %s instead of the generic upload error",
    async (kind) => {
      const error = new MediaUploadRefusedError(
        "You have reached the upload limit for the last 24 hours. Try again later."
      );
      const file =
        kind === "media"
          ? photo("a.jpg")
          : new File(["%PDF"], "doc.pdf", { type: "application/pdf" });
      if (kind === "media") {
        jest.mocked(multiPartUpload).mockRejectedValueOnce(error);
      } else {
        jest.mocked(multiPartAttachmentUpload).mockRejectedValueOnce(error);
      }
      await expect(
        generateParts(
          [{ content: "keep this draft", quoted_drop: null, media: [file] }],
          jest.fn(),
          ApiMediaUploadPurpose.Chat,
          "en-US"
        )
      ).rejects.toBe(error);
      if (kind === "attachment") {
        expect(multiPartAttachmentUpload).toHaveBeenCalledWith(
          expect.objectContaining({ file, locale: "en-US" })
        );
      }
    }
  );

  it("still reports other upload failures with the generic message", async () => {
    jest
      .mocked(multiPartUpload)
      .mockRejectedValueOnce(new Error("Something went wrong"));
    await expect(
      generateParts(
        [{ content: "x", quoted_drop: null, media: [photo("a.jpg")] }],
        jest.fn(),
        ApiMediaUploadPurpose.Chat
      )
    ).rejects.toThrow("Error uploading file. Please try again.");
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
