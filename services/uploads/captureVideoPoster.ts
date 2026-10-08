import {
  getNativeAppActivity,
  subscribeNativeAppActivity,
} from "@/services/app-activity/native-app-activity";

const CAPTURE_TIMEOUT_MS = 8000;
const MAX_POSTER_BYTES = 128 * 1024;
const MAX_POSTER_EDGE = 640;

/** One local frame during upload. Unsupported codecs/timeouts use backend capture. */
export function captureVideoPoster(
  file: File,
  signal: AbortSignal
): Promise<string | undefined> {
  if (signal.aborted || document.hidden || !getNativeAppActivity())
    return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const video = document.createElement("video");
    let objectUrl: string | undefined;
    let reader: FileReader | undefined;
    let settled = false;
    let capturing = false;
    let targetTime: number | undefined;
    let unsubscribeNative: () => void = () => undefined;

    const finish = (poster?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", failed);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribeNative();
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
      if (reader) {
        reader.onload = null;
        reader.onerror = null;
        reader.onabort = null;
        if (reader.readyState === FileReader.LOADING) reader.abort();
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(poster);
    };
    const failed = () => finish();
    const onVisibilityChange = () => {
      if (document.hidden || !getNativeAppActivity()) failed();
    };
    const timeout = setTimeout(failed, CAPTURE_TIMEOUT_MS);

    const readBlob = (blob: Blob | null) => {
      if (settled) return;
      if (
        blob?.type !== "image/jpeg" ||
        blob.size === 0 ||
        blob.size > MAX_POSTER_BYTES
      ) {
        failed();
        return;
      }
      try {
        reader = new FileReader();
        reader.onerror = failed;
        reader.onabort = failed;
        reader.onload = () => {
          const result = reader?.result;
          const prefix = "data:image/jpeg;base64,";
          finish(
            typeof result === "string" && result.startsWith(prefix)
              ? result.slice(prefix.length)
              : undefined
          );
        };
        reader.readAsDataURL(blob);
      } catch {
        failed();
      }
    };

    const capture = () => {
      if (
        settled ||
        capturing ||
        targetTime === undefined ||
        video.seeking ||
        video.readyState < 2 ||
        Math.abs(video.currentTime - targetTime) > 0.05
      )
        return;
      capturing = true;
      try {
        const canvas = createPosterCanvas(video);
        if (!canvas) {
          failed();
          return;
        }
        canvas.toBlob(readBlob, "image/jpeg", 0.75);
      } catch {
        failed();
      }
    };

    signal.addEventListener("abort", failed, { once: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    unsubscribeNative = subscribeNativeAppActivity(onVisibilityChange);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      if (settled) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        failed();
        return;
      }
      targetTime = Math.min(1, video.duration / 2);
      try {
        video.currentTime = targetTime;
        capture();
      } catch {
        failed();
      }
    };
    video.onloadeddata = capture;
    video.onseeked = capture;
    video.onerror = failed;
    try {
      objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;
      video.load();
    } catch {
      failed();
    }
  });
}

function createPosterCanvas(
  video: HTMLVideoElement
): HTMLCanvasElement | undefined {
  if (video.videoWidth <= 0 || video.videoHeight <= 0) return undefined;
  const canvas = document.createElement("canvas");
  const scale = Math.min(
    1,
    MAX_POSTER_EDGE / Math.max(video.videoWidth, video.videoHeight)
  );
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) return undefined;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}
