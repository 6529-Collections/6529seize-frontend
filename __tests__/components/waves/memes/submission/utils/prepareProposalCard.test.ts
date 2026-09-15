import { prepareProposalCard } from "@/components/waves/memes/submission/utils/prepareProposalCard";
import { createInitialState } from "@/components/waves/memes/submission/hooks/artworkSubmissionFormState";
import { createProposalCardThumbnail } from "@/lib/proposal-card/thumbnail";
import { commonApiPost } from "@/services/api/common-api";

jest.mock("@/lib/proposal-card/thumbnail", () => ({
  createProposalCardThumbnail: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));

const thumbnail = new File(["png"], "preview.png", { type: "image/png" });
const framed = { url: "ipfs://bafyframe/index.html", mime_type: "text/html" };
const setup = (mimeType = "image/png") => ({
  media: { url: "https://example.com/art", mime_type: mimeType },
  layout: "portrait" as const,
  title: "Art",
  operationalData: createInitialState({}).operationalData,
  uploadThumbnail: jest.fn(async () => ({
    url: "https://example.com/framed-preview.png",
    mime_type: "image/png",
  })),
  assertIdentity: jest.fn(),
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(createProposalCardThumbnail).mockResolvedValue(thumbnail);
  jest.mocked(commonApiPost).mockResolvedValue(framed);
});

it.each(["image/png", "video/mp4", "text/html"])(
  "publishes %s while preserving its source for resubmission",
  async (mimeType) => {
    const input = setup(mimeType);
    if (mimeType !== "image/png")
      input.operationalData.additional_media.preview_image =
        "https://example.com/still.png";
    const result = await prepareProposalCard(input);
    expect(result.media).toEqual(framed);
    expect(result.operationalData.additional_media.preview_image).toBe(
      "https://example.com/framed-preview.png"
    );
    expect(result.metadata.media_url).toBe(input.media.url);
    expect(result.metadata.mime_type).toBe(mimeType);
    expect(result.metadata.preview_image).toBe(
      input.operationalData.additional_media.preview_image
    );
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "drop-media/proposal-frame",
      body: {
        media_url: input.media.url,
        mime_type: mimeType,
        title: "Art",
        layout: "portrait",
      },
    });
  }
);

it("does not publish until the thumbnail upload succeeds", async () => {
  const input = setup();
  input.uploadThumbnail.mockRejectedValue(new Error("Upload failed"));
  await expect(prepareProposalCard(input)).rejects.toThrow("Upload failed");
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("rejects a blank title before creating or uploading a thumbnail", async () => {
  const input = { ...setup(), title: " \n " };
  await expect(prepareProposalCard(input)).rejects.toThrow(
    "Add an artwork title"
  );
  expect(createProposalCardThumbnail).not.toHaveBeenCalled();
  expect(input.uploadThumbnail).not.toHaveBeenCalled();
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("does not upload or publish after identity changes while rendering the thumbnail", async () => {
  const input = setup();
  input.assertIdentity
    .mockImplementationOnce(() => {})
    .mockImplementation(() => {
      throw new Error("Wallet changed");
    });
  await expect(prepareProposalCard(input)).rejects.toThrow("Wallet changed");
  expect(input.uploadThumbnail).not.toHaveBeenCalled();
  expect(commonApiPost).not.toHaveBeenCalled();
});

it("requires a still image for video and rejects unsupported media before work", async () => {
  await expect(prepareProposalCard(setup("video/mp4"))).rejects.toThrow(
    "Add a preview image"
  );
  await expect(prepareProposalCard(setup("model/gltf-binary"))).rejects.toThrow(
    "support images"
  );
  expect(createProposalCardThumbnail).not.toHaveBeenCalled();
});
