export interface MemesDropMedia {
  readonly mime_type: string;
  readonly url: string;
}

export interface MemesDropFileInfo {
  readonly name: string;
  readonly extension: string;
}

export interface MemesDropDownloadData {
  readonly url: string;
  readonly fileInfo: MemesDropFileInfo;
}
