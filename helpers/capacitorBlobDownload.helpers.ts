import type { FileInfo } from "@capacitor/filesystem";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Files handed to the native share sheet live only in this folder of the app
 * cache, so they can be found and removed again without touching anything
 * else the app keeps in its cache.
 */
const SHARE_CACHE_FOLDER = "share-temp";
/** Anything older than this was left behind by an interrupted share. */
const SHARE_CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const TIMESTAMP_PREFIX = /^(\d{13})-/;

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unexpected file read result"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("File read failed"));
    };
    reader.readAsDataURL(blob);
  });
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}

function safeCacheFileName(fileName: string): string {
  const safe = fileName
    .replaceAll(/[/\\?%*:|"<>]/g, "_")
    .replaceAll(/\s+/g, "_")
    .slice(0, 180);
  return safe || "download";
}

function cachePathForBlobDownload(fileName: string): string {
  return `${SHARE_CACHE_FOLDER}/${Date.now()}-${safeCacheFileName(fileName)}`;
}

async function deleteCacheFileQuietly(path: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ directory: Directory.Cache, path });
  } catch {
    // Already gone, or the platform refused; nothing else to do.
  }
}

function sharedFileAgeMs(file: FileInfo, now: number): number | null {
  if (typeof file.mtime === "number" && Number.isFinite(file.mtime)) {
    return now - file.mtime;
  }
  const prefix = TIMESTAMP_PREFIX.exec(file.name)?.[1];
  return prefix ? now - Number(prefix) : null;
}

async function removeStaleSharedFiles(): Promise<void> {
  let files: FileInfo[];
  try {
    ({ files } = await Filesystem.readdir({
      directory: Directory.Cache,
      path: SHARE_CACHE_FOLDER,
    }));
  } catch {
    // The folder does not exist yet, or listing is unavailable.
    return;
  }
  const now = Date.now();
  await Promise.all(
    files
      .filter((file) => {
        if (file.type !== "file" || !file.name) {
          return false;
        }
        const age = sharedFileAgeMs(file, now);
        return age !== null && age > SHARE_CACHE_MAX_AGE_MS;
      })
      .map((file) =>
        deleteCacheFileQuietly(`${SHARE_CACHE_FOLDER}/${file.name}`)
      )
  );
}

async function prepareShareCacheFolder(): Promise<void> {
  try {
    await Filesystem.mkdir({
      directory: Directory.Cache,
      path: SHARE_CACHE_FOLDER,
      recursive: true,
    });
  } catch {
    // Usually "already exists". Writes below also create missing parents.
  }
  await removeStaleSharedFiles();
}

export async function shareFetchedBlobInNativeApp(
  blob: Blob,
  fileName: string,
  options?: { readonly dialogTitle?: string | undefined }
): Promise<void> {
  const base64 = await blobToBase64(blob);
  await prepareShareCacheFolder();
  const path = cachePathForBlobDownload(fileName);
  try {
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    const { uri } = await Filesystem.getUri({
      directory: Directory.Cache,
      path,
    });
    await Share.share({
      title: fileName,
      url: uri,
      dialogTitle: options?.dialogTitle ?? "Save file",
    });
  } finally {
    // Same timing as downloadAndShareInNativeApp: Share resolves or rejects
    // once the native sheet has finished with the file.
    await deleteCacheFileQuietly(path);
  }
}

/**
 * Writes text to a temporary file, opens the share sheet for it and removes
 * the file afterwards, whether the share completed, was cancelled or failed.
 */
export async function shareTextFileInNativeApp(
  content: string,
  fileName: string,
  options: Readonly<{ title: string; text: string; dialogTitle: string }>
): Promise<void> {
  await prepareShareCacheFolder();
  const path = `${SHARE_CACHE_FOLDER}/${safeCacheFileName(fileName)}`;
  try {
    const { uri } = await Filesystem.writeFile({
      path,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    await Share.share({
      title: options.title,
      text: options.text,
      url: uri,
      dialogTitle: options.dialogTitle,
    });
  } finally {
    await deleteCacheFileQuietly(path);
  }
}

/** Keep original media bytes in native file storage, outside the WebView heap. */
export async function downloadAndShareInNativeApp(
  url: string,
  fileName: string,
  dialogTitle: string
): Promise<void> {
  await prepareShareCacheFolder();
  const path = cachePathForBlobDownload(fileName);
  try {
    // Shipped shells include Filesystem but not the replacement FileTransfer
    // plugin. Keep disk streaming compatible without requiring an app update.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    await Filesystem.downloadFile({
      url,
      path,
      directory: Directory.Cache,
      recursive: true,
      connectTimeout: 120_000,
      readTimeout: 120_000,
    });
    const { uri } = await Filesystem.getUri({
      directory: Directory.Cache,
      path,
    });
    await Share.share({ title: fileName, url: uri, dialogTitle });
  } finally {
    // Share resolves after the native sheet finishes; cancellation and failures
    // must not leave large originals accumulating in the app's cache.
    await deleteCacheFileQuietly(path);
  }
}
