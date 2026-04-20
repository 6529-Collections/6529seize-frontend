export interface MemesDropMedia {
  readonly mime_type: string;
  readonly url: string;
}

export const isMemesDropImageMedia = (
  media?: MemesDropMedia | null
): media is MemesDropMedia =>
  media?.mime_type.toLowerCase().startsWith("image/") ?? false;

export interface MemesDropFileInfo {
  readonly name: string;
  readonly extension: string;
}

export interface MemesDropDownloadData {
  readonly url: string;
  readonly fileInfo: MemesDropFileInfo;
}
