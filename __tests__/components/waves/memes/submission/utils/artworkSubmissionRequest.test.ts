import { transformToApiRequest } from "@/components/waves/memes/submission/utils/artworkSubmissionRequest";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

describe("transformToApiRequest", () => {
  it("preserves the upload reference in the signed drop payload", () => {
    const request = transformToApiRequest({
      waveId: "main-stage",
      traits: {
        title: "Artwork",
        description: "Description",
      } as TraitsData,
      media: {
        url: "https://cdn.example/drops/artwork.png",
        mime_type: "image/png",
        media_upload_id: "upload-123",
      },
      signerAddress: "0x0000000000000000000000000000000000000001",
      isSafeSignature: false,
    });

    expect(request.parts[0]?.media[0]).toEqual({
      url: "https://cdn.example/drops/artwork.png",
      mime_type: "image/png",
      media_upload_id: "upload-123",
    });
  });
});
