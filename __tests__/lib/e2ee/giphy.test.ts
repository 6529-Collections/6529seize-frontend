/** @jest-environment node */
import { downloadGiphyGif, GifDownloadError } from "@/lib/e2ee/giphy";
import { MAX_ATTACHMENT_FILE_BYTES } from "@/lib/e2ee/media";

const GIF_URL = "https://media1.giphy.com/media/test/giphy.gif?cid=public";
const GIF = new TextEncoder().encode("GIF89a-test-media");
const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<typeof fetch>();

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

it("bounds streamed bytes even when content-length is missing or incorrect", async () => {
  const cancel = jest.fn();
  fetchMock.mockResolvedValue(
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(GIF);
          controller.enqueue(new Uint8Array(MAX_ATTACHMENT_FILE_BYTES));
        },
        cancel,
      }),
      { headers: { "content-length": "1" } }
    )
  );
  await expect(download()).rejects.toMatchObject({ reason: "tooLarge" });
  expect(cancel).toHaveBeenCalled();
});

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
