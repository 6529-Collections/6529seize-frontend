export interface SuspendedVideoSource {
  readonly src: string;
  readonly currentTime: number;
}

/** Native media engines may reject a seek until their timeline is available. */
export function seekVideoPosition(
  video: HTMLVideoElement,
  currentTime: number
): boolean {
  if (!Number.isFinite(currentTime) || currentTime < 0) return false;
  try {
    video.currentTime =
      Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(currentTime, video.duration)
        : currentTime;
    return true;
  } catch {
    return false;
  }
}

export function restoreVideoPreferences(
  video: HTMLVideoElement,
  muted: boolean,
  volume: number
) {
  video.muted = muted;
  video.volume = volume;
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
    return (
      suspended.currentTime <= 0 ||
      seekVideoPosition(video, suspended.currentTime)
    );
  };
  const restoreEvents = ["loadedmetadata", "loadeddata", "canplay"];
  const cleanup = () =>
    restoreEvents.forEach((event) =>
      video.removeEventListener(event, retryRestore)
    );
  const retryRestore = () => {
    if (restorePosition()) cleanup();
  };
  restoreEvents.forEach((event) => video.addEventListener(event, retryRestore));
  video.src = suspended.src;
  video.load();
  // Seed the default start position before metadata; reapply on loadedmetadata
  // because loading/metadata may reset it in some media engines.
  restorePosition();
  return cleanup;
}
