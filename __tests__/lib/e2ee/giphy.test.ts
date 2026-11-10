/** @jest-environment node */
import { isGifPickerFile } from "@/lib/e2ee/gif-picker-files";
import { downloadGiphyGif, GifDownloadError } from "@/lib/e2ee/giphy";
import { MAX_ATTACHMENT_FILE_BYTES } from "@/lib/e2ee/media";

const GIF_URL = "https://media1.giphy.com/media/test/giphy.gif?cid=public";
const GIF = new TextEncoder().encode("GIF89a-test-media");
const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.useRealTimers();
});

const download = (url = GIF_URL) =>
  downloadGiphyGif(url, new AbortController().signal);

it("downloads original bytes without app credentials, referrer or redirected requests", async () => {
  fetchMock.mockResolvedValue(new Response(GIF));
  const file = await download();
  expect(file.name).toBe("giphy.gif");
  expect(file.type).toBe("image/gif");
  // Sent as downloaded, not cleaned or renamed like a user's own photo.
  expect(isGifPickerFile(file)).toBe(true);
  expect(new Uint8Array(await file.arrayBuffer())).toEqual(GIF);
  expect(fetchMock).toHaveBeenCalledWith(GIF_URL, {
    signal: expect.any(AbortSignal),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
    redirect: "error",
  });
});

it.each([
  "http://media.giphy.com/media/test/giphy.gif",
  "https://media.giphy.com.evil.test/giphy.gif",
  "https://user:password@media.giphy.com/giphy.gif",
  "https://media.giphy.com:8443/giphy.gif",
  "https://media.giphy.com/giphy.svg",
])("refuses an untrusted URL before fetching: %s", async (url) => {
  await expect(download(url)).rejects.toBeInstanceOf(GifDownloadError);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("rejects non-GIF bytes regardless of their declared MIME", async () => {
  fetchMock.mockResolvedValue(
    new Response("<html>unexpected</html>", {
      headers: { "content-type": "image/gif" },
    })
  );
  await expect(download()).rejects.toMatchObject({ reason: "unavailable" });
});

it("refuses a declared oversized file before reading it", async () => {
  fetchMock.mockResolvedValue(
    new Response(GIF, {
      headers: { "content-length": String(MAX_ATTACHMENT_FILE_BYTES + 1) },
    })
  );
  await expect(download()).rejects.toMatchObject({ reason: "tooLarge" });
});

it.each(["abc", "-1", "1.5", "1e3"])(
  "rejects a malformed content-length before reading: %s",
  async (declaredSize) => {
    const cancel = jest.fn();
    fetchMock.mockResolvedValue(
      new Response(new ReadableStream({ cancel }), {
        headers: { "content-length": declaredSize },
      })
    );
    await expect(download()).rejects.toMatchObject({ reason: "unavailable" });
    expect(cancel).toHaveBeenCalled();
  }
);

it.each([false, true])(
  "bounds streamed bytes and releases the reader even if cancellation fails: %s",
  async (cancelFails) => {
    const cancel = jest.fn(() =>
      cancelFails
        ? Promise.reject(new Error("Cancellation failed"))
        : Promise.resolve()
    );
    const response = new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(GIF);
          controller.enqueue(new Uint8Array(MAX_ATTACHMENT_FILE_BYTES));
        },
        cancel,
      }),
      { headers: { "content-length": "1" } }
    );
    fetchMock.mockResolvedValue(response);
    await expect(download()).rejects.toMatchObject({ reason: "tooLarge" });
    expect(cancel).toHaveBeenCalled();
    expect(response.body?.locked).toBe(false);
  }
);

it("aborts retrieval when the composer cancels it", async () => {
  const controller = new AbortController();
  fetchMock.mockImplementation(async (_url, options) => {
    controller.abort();
    options?.signal?.throwIfAborted();
    return new Response(GIF);
  });
  await expect(
    downloadGiphyGif(GIF_URL, controller.signal)
  ).rejects.toMatchObject({
    name: "AbortError",
  });
});

it("times out a stalled request", async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation(
    (_url, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError"))
        );
      })
  );
  const result = expect(download()).rejects.toMatchObject({
    name: "AbortError",
  });
  await jest.advanceTimersByTimeAsync(30_000);
  await result;
});
