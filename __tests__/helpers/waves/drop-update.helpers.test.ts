import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { ApiDropMediaStatus } from "@/generated/models/ApiDropMediaStatus";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import { buildDropUpdateRequest } from "@/helpers/waves/drop-update.helpers";

const createPart = (media: ApiDropMedia[], partId = 1): ApiDropPart => ({
  part_id: partId,
  content: `Part ${partId}`,
  quoted_drop: null,
  media,
  attachments: [],
});

const createDrop = (parts: ApiDropPart[]): ApiDrop => {
  const drop: Partial<ApiDrop> = {
    parts,
    title: null,
    metadata: [],
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_waves: [],
  };
  return drop as ApiDrop;
};

const image = {
  url: "https://example.com/photo.jpg",
  mime_type: "image/jpeg",
};

describe("buildDropUpdateRequest media", () => {
  it("keeps consecutive image edits valid after save responses add media status", () => {
    let drop = createDrop([createPart([image])]);

    for (const newContent of ["First edit", "Second edit", "Third edit"]) {
      const request = buildDropUpdateRequest({
        drop,
        activePartIndex: 0,
        newContent,
      });

      expect(request.parts[0]).toEqual({
        content: newContent,
        quoted_drop: null,
        media: [image],
      });

      // POST /drops/:id returns display fields absent from the normal V2 load.
      drop = {
        ...drop,
        parts: [
          {
            ...drop.parts[0]!,
            content: newContent,
            media: [
              {
                ...image,
                media_status: ApiDropMediaStatus.Ready,
                media_error: null,
              },
            ],
          },
        ],
      };
    }
  });

  it.each([null, "upload-id"])(
    "preserves media_upload_id=%s without copying response-only fields",
    (mediaUploadId) => {
      const media = {
        ...image,
        media_upload_id: mediaUploadId,
        media_status: ApiDropMediaStatus.Ready,
        media_error: null,
      };
      const drop = createDrop([createPart([media])]);
      const request = buildDropUpdateRequest({
        drop,
        activePartIndex: 0,
        newContent: "Updated caption",
      });

      expect(request.parts[0]?.media).toEqual([
        { ...image, media_upload_id: mediaUploadId },
      ]);
      expect(drop.parts[0]?.media).toEqual([media]);
    }
  );

  it("sanitizes media in unchanged storm parts", () => {
    const video = {
      url: "https://example.com/video.mp4",
      mime_type: "video/mp4",
    };
    const drop = createDrop([
      createPart([image]),
      createPart(
        [
          {
            ...video,
            media_status: ApiDropMediaStatus.Ready,
            media_error: null,
          },
        ],
        2
      ),
    ]);
    const request = buildDropUpdateRequest({
      drop,
      activePartIndex: 0,
      newContent: "Updated first part",
    });

    expect(request.parts).toEqual([
      {
        content: "Updated first part",
        quoted_drop: null,
        media: [image],
      },
      { content: "Part 2", quoted_drop: null, media: [video] },
    ]);
  });
});
