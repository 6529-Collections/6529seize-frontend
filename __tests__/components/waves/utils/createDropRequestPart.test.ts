import { toApiCreateDropPart } from "@/components/waves/utils/createDropRequestPart";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import type { CreateDropRequestPart } from "@/entities/IDrop";

describe("create drop request part helpers", () => {
  it("strips media upload status fields from create drop request media", () => {
    const part: CreateDropRequestPart = {
      content: "hello",
      quoted_drop: null,
      media: [
        {
          url: "https://cdn.example.com/drops/image.jpg",
          mime_type: "image/jpeg",
          media_upload_id: "media-upload-1",
          media_status: ApiDropMediaStatus.Processing,
          media_error: "still processing",
        },
      ],
      attachments: [{ attachment_id: "attachment-1" }],
      uploaded_attachments: [],
    };

    expect(toApiCreateDropPart(part)).toEqual({
      content: "hello",
      quoted_drop: null,
      media: [
        {
          url: "https://cdn.example.com/drops/image.jpg",
          mime_type: "image/jpeg",
          media_upload_id: "media-upload-1",
        },
      ],
      attachments: [{ attachment_id: "attachment-1" }],
    });
  });

  it("omits empty attachments and null media upload ids", () => {
    const part: CreateDropRequestPart = {
      content: null,
      quoted_drop: null,
      media: [
        {
          url: "https://cdn.example.com/drops/image.jpg",
          mime_type: "image/jpeg",
          media_upload_id: null,
        },
      ],
      attachments: [],
    };

    expect(toApiCreateDropPart(part)).toEqual({
      content: null,
      quoted_drop: null,
      media: [
        {
          url: "https://cdn.example.com/drops/image.jpg",
          mime_type: "image/jpeg",
        },
      ],
    });
  });
});
