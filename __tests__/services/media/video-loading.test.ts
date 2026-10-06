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
