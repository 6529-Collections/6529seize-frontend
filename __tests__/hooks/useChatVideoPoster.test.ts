import { act, renderHook } from "@testing-library/react";
import { useChatVideoPoster } from "@/hooks/useChatVideoPoster";
import { checkVideoAvailability } from "@/helpers/video.helpers";

let mockActive = true;
jest.mock("@/hooks/useMobileAppActivity", () => ({
  useMobileAppActivity: () => mockActive,
}));
jest.mock("@/helpers/video.helpers", () => ({
  ...jest.requireActual("@/helpers/video.helpers"),
  checkVideoAvailability: jest.fn(),
}));
const check = jest.mocked(checkVideoAvailability);
const source = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/clip.mp4";
const posterUrl =
  "https://d3lqz0a4bldqgf.cloudfront.net/renditions/drops/author/clip/poster/clip_poster.0000001.jpg";
let images: HTMLImageElement[];

beforeEach(() => {
  jest.useFakeTimers();
  mockActive = true;
  images = [];
  check.mockReset().mockResolvedValue(true);
  jest.spyOn(globalThis, "Image").mockImplementation(() => {
    const image = document.createElement("img");
    images.push(image);
    return image;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function imageAt(index: number): HTMLImageElement {
  const image = images[index];
  if (!image) throw new Error(`Missing preview image ${index}`);
  return image;
}

async function flush() {
  await act(async () => {});
}
function loaded(image: HTMLImageElement, width = 360, height = 640) {
  Object.defineProperties(image, {
    naturalWidth: { value: width },
    naturalHeight: { value: height },
  });
  act(() => {
    image.dispatchEvent(new Event("load"));
  });
}

it("loads the JPEG and exposes its portrait ratio without fetching video", async () => {
  const { result, rerender } = renderHook(
    ({ enabled }) => useChatVideoPoster(source, enabled),
    { initialProps: { enabled: true } }
  );
  await flush();
  expect(check).toHaveBeenCalledWith(posterUrl);
  expect(imageAt(0).src).toBe(posterUrl);
  expect(result.current).toBeUndefined();
  loaded(imageAt(0));
  expect(result.current).toEqual({ url: posterUrl, aspectRatio: 360 / 640 });
  rerender({ enabled: false });
  expect(result.current?.url).toBe(posterUrl);
  rerender({ enabled: true });
  await act(async () => {
    jest.advanceTimersByTime(120000);
  });
  expect(check).toHaveBeenCalledTimes(1);
});

it.each([source, "https://example.com/video.mp4", "image.png"])(
  "does not request a preview when disabled for %s",
  async (url) => {
    renderHook(() => useChatVideoPoster(url, false));
    await flush();
    expect(check).not.toHaveBeenCalled();
    expect(images).toHaveLength(0);
  }
);

it("ignores external videos even when enabled", async () => {
  renderHook(() => useChatVideoPoster("https://example.com/video.mp4", true));
  await flush();
  expect(check).not.toHaveBeenCalled();
});

it("bounds missing-preview retries and discovers a thumbnail that arrives later", async () => {
  check.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const { result } = renderHook(() => useChatVideoPoster(source, true));
  await flush();
  expect(images).toHaveLength(0);
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  loaded(imageAt(0), 640, 360);
  expect(result.current?.aspectRatio).toBe(640 / 360);
  expect(check).toHaveBeenCalledTimes(2);
});

it("stops after eight missing previews for older videos", async () => {
  check.mockResolvedValue(false);
  renderHook(() => useChatVideoPoster(source, true));
  await flush();
  for (let index = 0; index < 10; index += 1) {
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });
  }
  expect(check).toHaveBeenCalledTimes(8);
});

it("cleans up retries in background and resumes when active again", async () => {
  check.mockResolvedValue(false);
  const { rerender } = renderHook(() => useChatVideoPoster(source, true));
  await flush();
  mockActive = false;
  rerender();
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(check).toHaveBeenCalledTimes(1);
  mockActive = true;
  rerender();
  await flush();
  expect(check).toHaveBeenCalledTimes(2);
});

it("does not apply an old image after a source change and aborts its load", async () => {
  const { result, rerender } = renderHook(
    ({ url }) => useChatVideoPoster(url, true),
    { initialProps: { url: source } }
  );
  await flush();
  const oldImage = imageAt(0);
  rerender({ url: source.replace("clip.mp4", "other.mp4") });
  expect(oldImage.getAttribute("src")).toBeNull();
  loaded(oldImage);
  expect(result.current).toBeUndefined();
  await flush();
  loaded(imageAt(1));
  expect(result.current?.url).toContain(
    "/other/poster/other_poster.0000001.jpg"
  );
});

it("keeps failed images out of the player and cancels work when leaving view", async () => {
  const { result, rerender } = renderHook(
    ({ enabled }) => useChatVideoPoster(source, enabled),
    { initialProps: { enabled: true } }
  );
  await flush();
  act(() => {
    imageAt(0).dispatchEvent(new Event("error"));
  });
  expect(result.current).toBeUndefined();
  rerender({ enabled: false });
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(check).toHaveBeenCalledTimes(1);
});
