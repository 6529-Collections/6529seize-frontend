import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

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

function cachePathForBlobDownload(fileName: string): string {
  const safe = fileName
    .replaceAll(/[/\\?%*:|"<>]/g, "_")
    .replaceAll(/\s+/g, "_")
    .slice(0, 180);
  return `${Date.now()}-${safe || "download"}`;
}

export async function shareFetchedBlobWithNavigator(
  blob: Blob,
  fileName: string,
  title: string = fileName
): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof File === "undefined"
  ) {
    return false;
  }

  const file = new File([blob], fileName, { type: blob.type });
  const shareData: ShareData = {
    files: [file],
    title,
  };

  if (
    typeof navigator.canShare === "function" &&
    !navigator.canShare(shareData)
  ) {
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }
    return false;
  }
}

export async function shareFetchedBlobInNativeApp(
  blob: Blob,
  fileName: string,
  options?: {
    readonly dialogTitle?: string | undefined;
    readonly title?: string | undefined;
    readonly preferNavigatorShare?: boolean | undefined;
  }
): Promise<void> {
  if (options?.preferNavigatorShare) {
    const shared = await shareFetchedBlobWithNavigator(
      blob,
      fileName,
      options.title
    );
    if (shared) {
      return;
    }
  }

  const base64 = await blobToBase64(blob);
  const path = cachePathForBlobDownload(fileName);
  await Filesystem.writeFile({
    path,
    data: base64,
    directory: Directory.Cache,
  });
  const { uri } = await Filesystem.getUri({
    directory: Directory.Cache,
    path,
  });
  await Share.share({
    title: fileName,
    text: fileName,
    url: uri,
    dialogTitle: options?.dialogTitle ?? "Save file",
  });
}
