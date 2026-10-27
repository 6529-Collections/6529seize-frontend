import { transformToApiRequest } from "@/components/waves/memes/submission/utils/artworkSubmissionRequest";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";

describe("transformToApiRequest", () => {
  it("preserves the upload reference and strips response-only media fields", () => {
    const request = transformToApiRequest({
      waveId: "main-stage",
      traits: {
        title: "  Artwork  ",
        description: "\nFirst  paragraph.\n\nSecond paragraph.\t ",
      } as TraitsData,
      media: {
        url: "https://cdn.example/drops/artwork.png",
        mime_type: "image/png",
        media_upload_id: "upload-123",
        media_status: ApiDropMediaStatus.Ready,
        media_error: "response-only detail",
      },
      signerAddress: "0x0000000000000000000000000000000000000001",
      isSafeSignature: false,
    });

    expect(request.parts[0]?.media[0]).toEqual({
      url: "https://cdn.example/drops/artwork.png",
      mime_type: "image/png",
      media_upload_id: "upload-123",
    });
    expect(request.title).toBe("Artwork");
    expect(request.metadata).toEqual([
      { data_key: "title", data_value: "Artwork" },
      {
        data_key: "description",
        data_value: "First  paragraph.\n\nSecond paragraph.",
      },
      { data_key: "collab", data_value: "false" },
    ]);
    expect(request.parts[0]?.content).toBe(
      "\nFirst  paragraph.\n\nSecond paragraph.\t "
    );
  });
});
