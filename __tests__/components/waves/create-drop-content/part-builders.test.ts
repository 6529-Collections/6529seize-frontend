import { generateParts } from "@/components/waves/create-drop-content/part-builders";
import {
  multiPartAttachmentUpload,
  multiPartUpload,
} from "@/components/waves/create-wave/services/multiPartUpload";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";

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
          expect.objectContaining({ path: "drop", purpose })
        );
      }
      expect(multiPartAttachmentUpload).not.toHaveBeenCalled();
    }
  );
});
