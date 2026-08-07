import type { CreateDropConfig } from "@/entities/IDrop";
import { getCreateWaveDropRequest } from "@/components/waves/create-wave/services/createWaveDropRequest";
import { generateDropPart } from "@/components/waves/create-wave/services/waveMediaService";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import type { ApiDropReferencedNFT } from "@/generated/models/ApiDropReferencedNFT";

jest.mock("@/components/waves/create-wave/services/waveMediaService", () => ({
  generateDropPart: jest.fn(),
}));

const mockedGenerateDropPart = generateDropPart as jest.Mock;

const buildDrop = (
  overrides: Partial<CreateDropConfig> = {}
): CreateDropConfig =>
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
    ...overrides,
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

    const result = await getCreateWaveDropRequest(buildDrop());

    expect(result.parts[0]).toEqual({
      content: "Generated part",
      quoted_drop: null,
      media: [],
    });
    expect(result.parts[0]).not.toHaveProperty("attachments");
  });

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

    const result = await getCreateWaveDropRequest(buildDrop());

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

  it("normalises the title to null when the drop has none", async () => {
    mockedGenerateDropPart.mockResolvedValueOnce({
      content: "Generated part",
      quoted_drop: null,
      media: [],
    });

    const { title: _omittedTitle, ...untitledDrop } = buildDrop();
    const result = await getCreateWaveDropRequest(untitledDrop);

    expect(result.title).toBeNull();
    expect(result.signature).toBeNull();
  });

  it("maps referenced NFTs down to contract, token and name", async () => {
    mockedGenerateDropPart.mockResolvedValueOnce({
      content: "Generated part",
      quoted_drop: null,
      media: [],
    });

    // Typed as an intersection rather than cast: the picker really does hand
    // over extra client-side fields, and they must not reach the API request.
    const nftWithClientFields: ApiDropReferencedNFT & {
      readonly thumbnail: string;
    } = {
      contract: "0xcontract",
      token: "42",
      name: "The Memes #42",
      thumbnail: "https://example.com/thumb.png",
    };

    const result = await getCreateWaveDropRequest(
      buildDrop({ referenced_nfts: [nftWithClientFields] })
    );

    expect(result.referenced_nfts).toEqual([
      { contract: "0xcontract", token: "42", name: "The Memes #42" },
    ]);
  });

  it("maps mentioned users down to profile id and handle in content", async () => {
    mockedGenerateDropPart.mockResolvedValueOnce({
      content: "Generated part",
      quoted_drop: null,
      media: [],
    });

    const result = await getCreateWaveDropRequest(
      buildDrop({
        mentioned_users: [
          {
            mentioned_profile_id: "profile-1",
            handle_in_content: "alice",
            current_handle: "alice-renamed",
          },
        ],
      })
    );

    expect(result.mentioned_users).toEqual([
      { mentioned_profile_id: "profile-1", handle_in_content: "alice" },
    ]);
  });

  it("maps metadata down to key and value pairs", async () => {
    mockedGenerateDropPart.mockResolvedValueOnce({
      content: "Generated part",
      quoted_drop: null,
      media: [],
    });

    const result = await getCreateWaveDropRequest(
      buildDrop({
        metadata: [
          { data_key: "artist", data_value: "6529er" },
          { data_key: "medium", data_value: "generative" },
        ],
      })
    );

    expect(result.metadata).toEqual([
      { data_key: "artist", data_value: "6529er" },
      { data_key: "medium", data_value: "generative" },
    ]);
  });

  it("generates every part and preserves their order", async () => {
    mockedGenerateDropPart
      .mockResolvedValueOnce({
        content: "First",
        quoted_drop: null,
        media: [],
      })
      .mockResolvedValueOnce({
        content: "Second",
        quoted_drop: null,
        media: [],
      });

    const result = await getCreateWaveDropRequest(
      buildDrop({
        parts: [
          { content: "Source one", quoted_drop: null, media: [] },
          { content: "Source two", quoted_drop: null, media: [] },
        ],
      })
    );

    expect(mockedGenerateDropPart).toHaveBeenCalledTimes(2);
    expect(result.parts.map((part) => part.content)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("propagates part generation failures", async () => {
    mockedGenerateDropPart.mockRejectedValueOnce(
      new Error("attachment rejected")
    );

    await expect(getCreateWaveDropRequest(buildDrop())).rejects.toThrow(
      "attachment rejected"
    );
  });
});
