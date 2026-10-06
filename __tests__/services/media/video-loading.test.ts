import { restoreVideoSource } from "@/services/media/video-loading";

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
