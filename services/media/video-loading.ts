export interface SuspendedVideoSource {
  readonly src: string;
  readonly currentTime: number;
}

/** Unloading raw/native media aborts buffering; retain its position for reload. */
export function suspendVideoSource(
  video: HTMLVideoElement
): SuspendedVideoSource | null {
  const src = video.getAttribute("src");
  video.pause();
  if (!src) return null;
  const suspended = { src, currentTime: video.currentTime };
  video.removeAttribute("src");
  video.load();
  return suspended;
}

export function restoreVideoSource(
  video: HTMLVideoElement,
  suspended: SuspendedVideoSource
): () => void {
  const restorePosition = () => {
    if (Number.isFinite(suspended.currentTime) && suspended.currentTime > 0) {
      video.currentTime =
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.min(suspended.currentTime, video.duration)
          : suspended.currentTime;
    }
  };
  video.addEventListener("loadedmetadata", restorePosition, { once: true });
  video.src = suspended.src;
  video.load();
  // Seed the default start position before metadata; reapply on loadedmetadata
  // because loading/metadata may reset it in some media engines.
  try {
    restorePosition();
  } catch {
    // Some engines cannot seek yet. Keep the metadata listener armed to retry.
  }
  return () => video.removeEventListener("loadedmetadata", restorePosition);
}
