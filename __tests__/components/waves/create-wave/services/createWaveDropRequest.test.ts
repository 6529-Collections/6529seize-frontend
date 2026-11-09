import type { CreateDropConfig } from "@/entities/IDrop";
import { getCreateWaveDropRequest } from "@/components/waves/create-wave/services/createWaveDropRequest";
import { generateDropPart } from "@/components/waves/create-wave/services/waveMediaService";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";

jest.mock("@/components/waves/create-wave/services/waveMediaService", () => ({
  generateDropPart: jest.fn(),
}));

const mockedGenerateDropPart = generateDropPart as jest.Mock;

const buildDrop = (): CreateDropConfig =>
  ({
    title: "Drop title",
    parts: [
      {
        content: "Source part",
        quoted_drop: null,
        media: [],
      },
    ],
    referenced_nfts: [],
    mentioned_users: [],
    metadata: [],
    signature: null,
  }) as CreateDropConfig;

describe("getCreateWaveDropRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("omits attachments when a generated drop part has none", async () => {
    mockedGenerateDropPart.mockResolvedValueOnce({
      content: "Generated part",
      quoted_drop: null,
      media: [],
    });

    const result = await getCreateWaveDropRequest(
      buildDrop(),
      ApiMediaUploadPurpose.Chat
    );

    expect(result.parts[0]).toEqual({
      content: "Generated part",
      quoted_drop: null,
      media: [],
    });
    expect(result.parts[0]).not.toHaveProperty("attachments");
  });

  it.each([ApiMediaUploadPurpose.Chat, ApiMediaUploadPurpose.DecisionEntry])(
    "uploads each part's media with the %s purpose",
    async (purpose) => {
      mockedGenerateDropPart.mockResolvedValueOnce({
        content: "Generated part",
        quoted_drop: null,
        media: [],
      });

      await getCreateWaveDropRequest(buildDrop(), purpose);

      expect(mockedGenerateDropPart).toHaveBeenCalledWith(
        expect.objectContaining({ content: "Source part" }),
        purpose
      );
    }
  );

  it("copies attachments from generated drop parts", async () => {
    mockedGenerateDropPart.mockResolvedValueOnce({
      content: "Generated part",
      quoted_drop: null,
      media: [
        {
          url: "https://example.com/image.png",
          mime_type: "image/png",
          media_upload_id: "media-upload-1",
          media_status: ApiDropMediaStatus.Processing,
          media_error: "still processing",
        },
      ],
      attachments: [{ attachment_id: "attachment-1" }],
    });

    const result = await getCreateWaveDropRequest(
      buildDrop(),
      ApiMediaUploadPurpose.Chat
    );

    expect(result.parts[0]).toEqual({
      content: "Generated part",
      quoted_drop: null,
      media: [
        {
          url: "https://example.com/image.png",
          mime_type: "image/png",
          media_upload_id: "media-upload-1",
        },
      ],
      attachments: [{ attachment_id: "attachment-1" }],
    });
  });
});
