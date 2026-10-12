import { act, renderHook } from "@testing-library/react";
import {
  checkVideoAvailability,
  getVideoConversions,
} from "@/helpers/video.helpers";
import { useChatVideoPoster } from "@/hooks/useChatVideoPoster";

let mockActive = true;
jest.mock("@/hooks/useMobileAppActivity", () => ({
  useMobileAppActivity: () => mockActive,
}));

let fixtureNumber = 0;
let source: string;
let urls: NonNullable<ReturnType<typeof getVideoConversions>>;
let ready: boolean;
let images: HTMLImageElement[];
let posterSource: "generated" | "device";
let deliveryFailure: boolean;
const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
  if (!ready && deliveryFailure) throw new Error("Temporary delivery failure");
  const available =
    posterSource === "device" ? urls.DEVICE_POSTER : urls.POSTER;
  return { ok: ready && String(input) === available } as Response;
});

beforeEach(() => {
  jest.useFakeTimers();
  mockActive = true;
  ready = false;
  deliveryFailure = false;
  posterSource = "generated";
  images = [];
  source = `https://d3lqz0a4bldqgf.cloudfront.net/drops/author/retry-${++fixtureNumber}.mp4`;
  const conversions = getVideoConversions(source);
  if (!conversions) throw new Error("Missing test video conversions");
  urls = conversions;
  fetchMock.mockClear();
  jest.spyOn(globalThis, "fetch").mockImplementation(fetchMock);
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

function finishImage() {
  const image = images[0];
  if (!image) throw new Error("Missing preview image");
  Object.defineProperties(image, {
    naturalWidth: { value: 360 },
    naturalHeight: { value: 640 },
  });
  act(() => image.dispatchEvent(new Event("load")));
  return image;
}

it.each([false, true])(
  "discovers a generated portrait poster five seconds later with the real cache (network failure: %s)",
  async (networkFailure) => {
    deliveryFailure = networkFailure;
    const { result } = renderHook(() => useChatVideoPoster(source, true));
    await act(async () => {});
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(images).toHaveLength(0);

    ready = true;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(4999);
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1);
    });
    expect(finishImage().src).toBe(urls.POSTER);
    expect(result.current).toEqual({
      url: urls.POSTER,
      aspectRatio: 360 / 640,
    });
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(
      fetchMock.mock.calls.every(([url]) => String(url).endsWith(".jpg"))
    ).toBe(true);
  }
);

it("discovers a device poster that becomes deliverable after the initial miss", async () => {
  posterSource = "device";
  const { result } = renderHook(() => useChatVideoPoster(source, true));
  await act(async () => {});
  ready = true;
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });
  finishImage();
  expect(result.current?.url).toBe(urls.DEVICE_POSTER);
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it("rechecks even when a missing poster was cached with the default sixty-second lifetime", async () => {
  await checkVideoAvailability(urls.POSTER);
  const { result } = renderHook(() => useChatVideoPoster(source, true));
  await act(async () => {});
  expect(fetchMock).toHaveBeenCalledTimes(3);
  ready = true;
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });
  finishImage();
  expect(result.current?.url).toBe(urls.POSTER);
  expect(fetchMock).toHaveBeenCalledTimes(5);
});

it("retains successful poster checks in the shared cache", async () => {
  ready = true;
  renderHook(() => useChatVideoPoster(source, true));
  await act(async () => {});
  finishImage();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(60000);
  });
  expect(await checkVideoAvailability(urls.POSTER)).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("pauses prompt retries outside view and while inactive, then discovers the poster on return", async () => {
  const { result, rerender } = renderHook(
    ({ enabled }) => useChatVideoPoster(source, enabled),
    { initialProps: { enabled: true } }
  );
  await act(async () => {});
  rerender({ enabled: false });
  ready = true;
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });
  expect(fetchMock).toHaveBeenCalledTimes(3);
  mockActive = false;
  rerender({ enabled: true });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });
  expect(fetchMock).toHaveBeenCalledTimes(3);
  mockActive = true;
  rerender({ enabled: true });
  await act(async () => {});
  finishImage();
  expect(result.current?.url).toBe(urls.POSTER);
});
