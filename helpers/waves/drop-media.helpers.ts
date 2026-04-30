import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";

export interface DropDownloadMedia {
  readonly url: string;
  readonly name: string;
  readonly extension: string;
  readonly partIndex: number;
  readonly mediaIndex: number;
}

export function getDropDownloadMedia(drop: Partial<Pick<ApiDrop, "parts">>) {
  return (drop.parts ?? []).flatMap((part, partIndex) =>
    (part.media ?? []).flatMap((media, mediaIndex) => {
      const fileInfo = getFileInfoFromUrl(media.url);
      if (!fileInfo) {
        return [];
      }
      return [
        {
          url: media.url,
          name: fileInfo.name,
          extension: fileInfo.extension,
          partIndex,
          mediaIndex,
        },
      ];
    })
  );
}
