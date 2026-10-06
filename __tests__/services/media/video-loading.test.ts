import {
  restoreVideoSource,
  suspendVideoSource,
} from "@/services/media/video-loading";

afterEach(() => jest.restoreAllMocks());

it.each([
  ["ignored", "loadedmetadata"],
  ["rejected", "loadedmetadata"],
  ["ignored", "canplay"],
  ["rejected", "canplay"],
])(
  "restores audio when early preference assignments are %s until %s",
  (earlyAssignment, readyEvent) => {
    const video = document.createElement("video");
    jest.spyOn(video, "pause").mockImplementation(() => undefined);
    const load = jest.spyOn(video, "load").mockImplementation(() => undefined);
    video.src = "clip.mp4";
    video.currentTime = 480;
    video.muted = false;
    video.volume = 0.6;
    const suspended = suspendVideoSource(video)!;
    let ready = false;
    const values = { muted: true, volume: 1 };
    function writePreference(
      key: keyof typeof values,
      value: boolean | number
    ) {
      if (!ready && earlyAssignment === "rejected")
        throw new DOMException("Media is not ready", "InvalidStateError");
      if (ready) Object.assign(values, { [key]: value });
    }
    Object.defineProperties(video, {
      muted: {
        configurable: true,
        get: () => values.muted,
        set: (value: boolean) => writePreference("muted", value),
      },
      volume: {
        configurable: true,
        get: () => values.volume,
        set: (value: number) => writePreference("volume", value),
      },
    });
    load.mockClear();
    const cleanup = restoreVideoSource(video, suspended);
    if (readyEvent === "canplay")
      video.dispatchEvent(new Event("loadedmetadata"));
    expect(video.muted).toBe(true);
    ready = true;
    video.dispatchEvent(new Event(readyEvent));
    expect(video.currentTime).toBe(480);
    expect(video.muted).toBe(false);
    expect(video.volume).toBe(0.6);
    // Later user choices must not be overwritten by another readiness event.
    video.muted = true;
    video.volume = 0.4;
    video.dispatchEvent(new Event("loadeddata"));
    expect(video.muted).toBe(true);
    expect(video.volume).toBe(0.4);
    expect(load).toHaveBeenCalledTimes(1);
    cleanup();
  }
);

it("retries position restoration on metadata when an early seek throws", () => {
  const video = document.createElement("video");
  jest.spyOn(video, "load").mockImplementation(() => undefined);
  let metadataReady = false;
  let position = 0;
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    get: () => position,
    set: (value: number) => {
      if (!metadataReady)
        throw new DOMException("Not seekable yet", "InvalidStateError");
      position = value;
    },
  });
  const cleanup = restoreVideoSource(video, {
    src: "clip.mp4",
    currentTime: 12,
    muted: false,
    volume: 0.6,
  });
  expect(position).toBe(0);
  expect(video).toHaveAttribute("src", "clip.mp4");
  metadataReady = true;
  video.dispatchEvent(new Event("loadedmetadata"));
  expect(position).toBe(12);
  cleanup();
});

it("removes a pending metadata restoration when the source is suspended again", () => {
  const video = document.createElement("video");
  jest.spyOn(video, "load").mockImplementation(() => undefined);
  const cleanup = restoreVideoSource(video, {
    src: "clip.mp4",
    currentTime: 12,
    muted: false,
    volume: 0.6,
  });
  cleanup();
  video.currentTime = 3;
  video.dispatchEvent(new Event("loadedmetadata"));
  expect(video.currentTime).toBe(3);
});

it("retains the saved position when native HLS metadata is not seekable yet", () => {
  const video = document.createElement("video");
  jest.spyOn(video, "load").mockImplementation(() => undefined);
  let canSeek = false;
  let position = 0;
  Object.defineProperty(video, "currentTime", {
    configurable: true,
    get: () => position,
    set: (value: number) => {
      if (!canSeek)
        throw new DOMException("Not seekable yet", "InvalidStateError");
      position = value;
    },
  });
  const cleanup = restoreVideoSource(video, {
    src: "clip.m3u8",
    currentTime: 480,
    muted: false,
    volume: 0.6,
  });
  video.dispatchEvent(new Event("loadedmetadata"));
  expect(position).toBe(0);
  canSeek = true;
  video.dispatchEvent(new Event("canplay"));
  expect(position).toBe(480);
  position = 15;
  video.dispatchEvent(new Event("loadeddata"));
  expect(position).toBe(15);
  cleanup();
});
