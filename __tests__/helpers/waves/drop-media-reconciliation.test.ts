import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import { ApiDropMediaStatus as Status } from "@/generated/models/ApiDropMediaStatus";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { reconcileDropMedia } from "@/helpers/waves/drop-media-reconciliation";
import { ChatStore } from "@/lib/chat-store";

const media = (overrides: Partial<ApiDropMedia> = {}): ApiDropMedia =>
  Object.assign(new ApiDropMedia(), {
    url: "https://example.com/image.png",
    mime_type: "image/png",
    ...overrides,
  });
const drop = (
  items: ApiDropMedia[],
  updatedAt: number | null = null
): ApiDrop =>
  Object.assign(new ApiDrop(), {
    id: "image-message",
    serial_no: 2,
    created_at: 1000,
    updated_at: updatedAt,
    wave: { id: "wave" },
    author: { id: "author", handle: "author" },
    title: null,
    metadata: [],
    parts: [
      {
        part_id: 1,
        content: "Text with the image",
        media: items,
        attachments: [],
      },
    ],
  });
const ready = () =>
  media({
    media_upload_id: "upload",
    media_status: Status.Ready,
    media_error: null,
    width: 927,
    height: 447,
    thumbhash: "placeholder",
  });

describe("drop media lifecycle reconciliation", () => {
  it.each([Status.Uploading, Status.Processing, undefined])(
    "retains finalized readiness and layout after a late %s snapshot",
    (status) => {
      const incomingMedia = status ? media({ media_status: status }) : media();
      expect(
        reconcileDropMedia(drop([incomingMedia]), drop([ready()])).parts[0]
          ?.media
      ).toEqual([ready()]);
    }
  );

  it("keeps processing protection when an older feed omits readiness", () => {
    const processing = media({
      media_status: Status.Processing,
      media_upload_id: "upload",
    });
    expect(
      reconcileDropMedia(drop([media()]), drop([processing])).parts[0]?.media
    ).toEqual([processing]);
  });

  it("accepts a terminal failure after ready and retains it over processing", () => {
    const failed = media({
      media_status: Status.Failed,
      media_error: "sanitization_failed",
    });
    const result = reconcileDropMedia(drop([failed]), drop([ready()]));
    expect(result.parts[0]?.media[0]).toMatchObject({
      media_status: Status.Failed,
      media_error: "sanitization_failed",
    });
    expect(
      reconcileDropMedia(
        drop([media({ media_status: Status.Processing })]),
        result
      ).parts[0]?.media[0]
    ).toMatchObject({
      media_status: Status.Failed,
      media_error: "sanitization_failed",
    });
  });

  it.each([
    media({
      url: "https://example.com/replacement.png",
      media_status: Status.Processing,
    }),
    media({
      media_upload_id: "different-upload",
      media_status: Status.Processing,
    }),
  ])("does not transfer readiness to replacement media %j", (replacement) => {
    expect(
      reconcileDropMedia(drop([replacement]), drop([ready()])).parts[0]?.media
    ).toEqual([replacement]);
  });

  it("respects a newer edit, removed media, and removed parts", () => {
    const incoming = drop([media({ media_status: Status.Processing })], 2000);
    expect(reconcileDropMedia(incoming, drop([ready()]))).toBe(incoming);
    expect(
      reconcileDropMedia(drop([]), drop([ready()])).parts[0]?.media
    ).toEqual([]);
    expect(
      reconcileDropMedia({ ...drop([]), parts: [] }, drop([ready()])).parts
    ).toEqual([]);
  });

  it("keeps ready state in the normalized store after a late processing response", () => {
    const store = new ChatStore();
    store.merge("wave", [convertApiDropToExtendedDrop(drop([ready()]))]);
    store.merge("wave", [
      convertApiDropToExtendedDrop(
        drop([media({ media_status: Status.Processing })])
      ),
    ]);
    expect(store.get("wave", "image-message")).toMatchObject({
      parts: [{ content: "Text with the image", media: [ready()] }],
    });
  });

  it("keeps ready state in cached feeds and drop detail queries", () => {
    const client = new QueryClient();
    const key = [QueryKey.DROPS, { waveId: "wave" }];
    client.setQueryData(key, { pages: [{ drops: [drop([ready()])] }] });
    updateDropInCachedDrops(
      client,
      drop([media({ media_status: Status.Processing })])
    );
    expect(client.getQueryData(key)).toMatchObject({
      pages: [{ drops: [{ parts: [{ media: [ready()] }] }] }],
    });
    client.clear();
  });
});
