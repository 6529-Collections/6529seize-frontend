export interface SuspendedVideoSource {
  readonly src: string;
  readonly currentTime: number;
  readonly muted: boolean;
  readonly volume: number;
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
): boolean {
  try {
    video.muted = muted;
    video.volume = volume;
    return video.muted === muted && video.volume === volume;
  } catch {
    // Some media engines cannot accept preferences until the source is ready.
    return false;
  }
}

/** Unloading raw/native media aborts buffering; retain its position for reload. */
export function suspendVideoSource(
  video: HTMLVideoElement
): SuspendedVideoSource | null {
  const src = video.getAttribute("src");
  video.pause();
  if (!src) return null;
  const suspended = {
    src,
    currentTime: video.currentTime,
    muted: video.muted,
    volume: video.volume,
  };
  video.removeAttribute("src");
  video.load();
  return suspended;
}

export function restoreVideoSource(
  video: HTMLVideoElement,
  suspended: SuspendedVideoSource
): () => void {
  const restoreState = () => {
    const preferencesReady = restoreVideoPreferences(
      video,
      suspended.muted,
      suspended.volume
    );
    const positionReady =
      suspended.currentTime <= 0 ||
      seekVideoPosition(video, suspended.currentTime);
    return preferencesReady && positionReady;
  };
  const restoreEvents = ["loadedmetadata", "loadeddata", "canplay"];
  const cleanup = () =>
    restoreEvents.forEach((event) =>
      video.removeEventListener(event, retryRestore)
    );
  const retryRestore = () => {
    if (restoreState()) cleanup();
  };
  restoreEvents.forEach((event) => video.addEventListener(event, retryRestore));
  video.src = suspended.src;
  video.load();
  // Seed state eagerly; reapply when ready because loading can reset the
  // timeline or preferences in some media engines.
  restoreState();
  return cleanup;
}
