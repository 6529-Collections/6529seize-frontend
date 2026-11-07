import { Capacitor } from "@capacitor/core";

const MAX_WIDTH = 1024;
const JPEG_QUALITY = 0.6;

/**
 * Screen capture needs `getDisplayMedia`, which the iOS and Android web views
 * lack and the desktop app does not route; the option is shown on web only.
 */
export function isScreenshotSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  if (Capacitor.isNativePlatform() || navigator.userAgent.includes("Electron"))
    return false;
  return (
    "mediaDevices" in navigator &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  );
}

/**
 * Asks the browser to capture one frame of a tab, window or screen the person
 * picks, scaled to at most 1024 px wide, as a JPEG data URL. Resolves null if
 * they cancel or capture fails. The stream stops right after the frame.
 */
export async function captureScreenshot(): Promise<string | null> {
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    await video.play();
    const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    video.srcObject = null;
    return canvas.width > 0
      ? canvas.toDataURL("image/jpeg", JPEG_QUALITY)
      : null;
  } catch {
    return null;
  } finally {
    for (const track of stream?.getTracks() ?? []) track.stop();
  }
}
