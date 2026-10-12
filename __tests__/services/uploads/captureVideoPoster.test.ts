import { captureVideoPoster } from "@/services/uploads/captureVideoPoster";
let mockNativeActive = true;
let mockNativeChanged: (() => void) | undefined;
const mockUnsubscribe = jest.fn();
jest.mock("@/services/app-activity/native-app-activity", () => ({
  getNativeAppActivity: () => mockNativeActive,
  subscribeNativeAppActivity: (changed: () => void) => {
    mockNativeChanged = changed;
    return mockUnsubscribe;
  },
}));

let video: HTMLVideoElement;
let canvas: HTMLCanvasElement;
let drawImage: jest.Mock;
let toBlob: jest.SpyInstance;
const file = new File(["local-video"], "clip.mp4", { type: "video/mp4" });

beforeEach(() => {
  jest.useFakeTimers();
  mockNativeActive = true;
  mockUnsubscribe.mockClear();
  jest.spyOn(document, "hidden", "get").mockReturnValue(false);
  URL.createObjectURL = jest.fn(() => "blob:local-video");
  URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const create = document.createElement.bind(document);
  jest.spyOn(document, "createElement").mockImplementation((tag, options) => {
    const element = create(tag, options);
    if (tag === "video") {
      video = element as HTMLVideoElement;
      Object.defineProperties(video, {
        duration: { configurable: true, value: 35 },
        videoWidth: { configurable: true, value: 360 },
        videoHeight: { configurable: true, value: 640 },
        readyState: { configurable: true, value: 2 },
        seeking: { configurable: true, value: false },
      });
    }
    if (tag === "canvas") canvas = element as HTMLCanvasElement;
    return element;
  });
  drawImage = jest.fn();
  jest
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  toBlob = jest
    .spyOn(HTMLCanvasElement.prototype, "toBlob")
    .mockImplementation((callback) =>
      callback(new Blob(["jpeg"], { type: "image/jpeg" }))
    );
  jest
    .spyOn(FileReader.prototype, "readAsDataURL")
    .mockImplementation(function (this: FileReader) {
      Object.defineProperty(this, "result", {
        value: "data:image/jpeg;base64,cG9zdGVy",
      });
      this.dispatchEvent(new ProgressEvent("load"));
    });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it.each([
  [360, 640, 360, 640],
  [3840, 2160, 640, 360],
])(
  "captures one local frame preserving %s by %s proportions",
  async (width, height, expectedWidth, expectedHeight) => {
    const result = captureVideoPoster(file, new AbortController().signal);
    Object.defineProperties(video, {
      videoWidth: { value: width },
      videoHeight: { value: height },
    });
    video.dispatchEvent(new Event("loadedmetadata"));
    expect(video.currentTime).toBe(1);
    expect(await result).toBe("cG9zdGVy");
    expect(canvas.width).toBe(expectedWidth);
    expect(canvas.height).toBe(expectedHeight);
    expect(drawImage).toHaveBeenCalledTimes(1);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(video.getAttribute("src")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:local-video");
    expect(jest.getTimerCount()).toBe(0);
  }
);
it("uses an available frame inside a sub-second video", async () => {
  const result = captureVideoPoster(file, new AbortController().signal);
  Object.defineProperty(video, "duration", { value: 0.4 });
  video.dispatchEvent(new Event("loadedmetadata"));
  expect(video.currentTime).toBe(0.2);
  expect(await result).toBeDefined();
});
it("waits for the requested frame to decode before capturing", async () => {
  const result = captureVideoPoster(file, new AbortController().signal);
  Object.defineProperty(video, "readyState", { value: 1 });
  video.dispatchEvent(new Event("loadedmetadata"));
  expect(drawImage).not.toHaveBeenCalled();
  Object.defineProperty(video, "readyState", { value: 2 });
  video.dispatchEvent(new Event("seeked"));
  expect(await result).toBeDefined();
});
it.each(["timeout", "codec error", "abort", "background", "native background"])(
  "returns no poster and releases resources on %s",
  async (reason) => {
    const controller = new AbortController();
    const result = captureVideoPoster(file, controller.signal);
    if (reason === "timeout") jest.advanceTimersByTime(8000);
    if (reason === "codec error") video.dispatchEvent(new Event("error"));
    if (reason === "abort") controller.abort();
    if (reason === "background") {
      jest.spyOn(document, "hidden", "get").mockReturnValue(true);
      document.dispatchEvent(new Event("visibilitychange"));
    }
    if (reason === "native background") {
      mockNativeActive = false;
      mockNativeChanged?.();
    }
    expect(await result).toBeUndefined();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(video.getAttribute("src")).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  }
);
it("discards an oversized image", async () => {
  toBlob.mockImplementation((callback: BlobCallback) =>
    callback(new Blob([new Uint8Array(131073)], { type: "image/jpeg" }))
  );
  const result = captureVideoPoster(file, new AbortController().signal);
  video.dispatchEvent(new Event("loadedmetadata"));
  expect(await result).toBeUndefined();
});
it("ignores an encoding callback that finishes after timeout", async () => {
  let callback: BlobCallback | undefined;
  toBlob.mockImplementation((next: BlobCallback) => {
    callback = next;
  });
  const result = captureVideoPoster(file, new AbortController().signal);
  video.dispatchEvent(new Event("loadedmetadata"));
  jest.advanceTimersByTime(8000);
  expect(await result).toBeUndefined();
  callback?.(new Blob(["jpeg"], { type: "image/jpeg" }));
  expect(FileReader.prototype.readAsDataURL).not.toHaveBeenCalled();
});
