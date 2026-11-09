import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { uploadClaimMedia } from "@/services/api/memes-minting-claims-api";
import { multipartUploadCore } from "@/services/uploads/multipartUploadCore";

jest.mock("@/services/uploads/multipartUploadCore", () => ({
  multipartUploadCore: jest.fn(),
}));

describe("uploadClaimMedia", () => {
  it("uploads minted card art as decision_entry so the original file is kept", async () => {
    jest.mocked(multipartUploadCore).mockResolvedValue({
      media_url: "https://cdn.example/card.png",
    });
    const file = new File(["art"], "card.png", { type: "image/png" });

    await expect(uploadClaimMedia(1, "image_url", file)).resolves.toBe(
      "https://cdn.example/card.png"
    );
    expect(multipartUploadCore).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        endpoints: expect.objectContaining({
          start: "drop-media/multipart-upload",
        }),
        purpose: ApiMediaUploadPurpose.DecisionEntry,
      })
    );
  });
});
