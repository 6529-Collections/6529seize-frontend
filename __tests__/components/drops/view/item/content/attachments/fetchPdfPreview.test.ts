import { ReadableStream } from "node:stream/web";
import { waitFor } from "@testing-library/react";
import {
  fetchPdfPreview,
  PDF_PREVIEW_MAX_BYTES,
  PDF_PREVIEW_TIMEOUT_MS,
  PDF_RANGE_CHUNK_SIZE as CHUNK,
  PdfPreviewSizeError,
} from "@/components/drops/view/item/content/attachments/fetchPdfPreview";

jest.mock("react-pdf", () => ({
  pdfjs: {
    PDFDataRangeTransport: jest.fn((length, initialData) => ({
      length,
      initialData,
      onDataRange: jest.fn(),
    })),
  },
}));
const url = "https://media.example.test/document.pdf";
function response(
  chunks: Uint8Array[],
  headers: Record<string, string> = {},
  status = 200
) {
  const cancel = jest.fn();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
    cancel,
  });
  return {
    response: {
      ok: status < 400,
      status,
      headers: new Headers(headers),
      body,
    } as unknown as Response,
    cancel,
  };
}
function partial(begin = 0, end = CHUNK, length = 3 * CHUNK) {
  return response(
    [new Uint8Array(end - begin)],
    {
      "content-range": `bytes ${begin}-${end - 1}/${length}`,
      "content-length": String(end - begin),
    },
    206
  ).response;
}
beforeEach(() => {
  jest.spyOn(globalThis, "fetch").mockReset();
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it("falls back to a bounded full response without credentials or a referrer", async () => {
  const fixture = response([new Uint8Array([1, 2]), new Uint8Array([3])]);
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(fixture.response);
  const { signal } = new AbortController();
  await expect(fetchPdfPreview(url, signal, jest.fn())).resolves.toEqual({
    data: new Uint8Array([1, 2, 3]),
  });
  expect(fetch).toHaveBeenCalledWith(url, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: { Range: `bytes=0-${CHUNK - 1}` },
  });
});
it("rejects unavailable documents", async () => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false } as Response);
  await expect(
    fetchPdfPreview(url, new AbortController().signal, jest.fn())
  ).rejects.toThrow("PDF request failed");
});
it.each([true, false])(
  "bounds oversized full responses with declared length %s",
  async (declared) => {
    const fixture = response(
      [new Uint8Array(PDF_PREVIEW_MAX_BYTES + 1)],
      declared ? { "content-length": String(PDF_PREVIEW_MAX_BYTES + 1) } : {}
    );
    jest.spyOn(globalThis, "fetch").mockResolvedValue(fixture.response);
    await expect(
      fetchPdfPreview(url, new AbortController().signal, jest.fn())
    ).rejects.toBeInstanceOf(PdfPreviewSizeError);
  }
);
it("does not return bytes after cancellation", async () => {
  const controller = new AbortController();
  const fixture = response([new Uint8Array([1])]);
  jest.spyOn(globalThis, "fetch").mockImplementation(async () => {
    controller.abort();
    return fixture.response;
  });
  await expect(
    fetchPdfPreview(url, controller.signal, jest.fn())
  ).rejects.toMatchObject({ name: "AbortError" });
});
it("requests additional chunks only when PDF.js needs them", async () => {
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(partial())
    .mockResolvedValueOnce(partial(2 * CHUNK, 3 * CHUNK));
  const controller = new AbortController();
  const onError = jest.fn();
  const file = await fetchPdfPreview(url, controller.signal, onError);
  if (!("range" in file)) throw new Error("Expected range loading");
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(file.range.length).toBe(3 * CHUNK);
  file.range.requestDataRange(2 * CHUNK, 3 * CHUNK);
  await waitFor(() =>
    expect(file.range.onDataRange).toHaveBeenCalledWith(
      2 * CHUNK,
      new Uint8Array(CHUNK)
    )
  );
  expect(fetch).toHaveBeenLastCalledWith(
    url,
    expect.objectContaining({
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { Range: `bytes=${2 * CHUNK}-${3 * CHUNK - 1}` },
    })
  );
  const requestSignal = fetch.mock.calls[1]?.[1]?.signal;
  controller.abort();
  expect(requestSignal?.aborted).toBe(true);
  file.range.requestDataRange(CHUNK, 2 * CHUNK);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(onError).not.toHaveBeenCalled();
});
it("uses a single request for a small file served as a range", async () => {
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(partial(0, 100, 100));
  await expect(
    fetchPdfPreview(url, new AbortController().signal, jest.fn())
  ).resolves.toEqual({ data: new Uint8Array(100) });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it("falls back when Content-Range is not visible through CORS", async () => {
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(response([new Uint8Array(CHUNK)], {}, 206).response)
    .mockResolvedValueOnce(response([new Uint8Array([1])]).response);
  await expect(
    fetchPdfPreview(url, new AbortController().signal, jest.fn())
  ).resolves.toEqual({ data: new Uint8Array([1]) });
  expect(fetch.mock.calls[1]?.[1]).not.toHaveProperty("headers");
});
it("rejects an oversized document before reading its first range", async () => {
  jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(partial(0, CHUNK, PDF_PREVIEW_MAX_BYTES + 1));
  await expect(
    fetchPdfPreview(url, new AbortController().signal, jest.fn())
  ).rejects.toBeInstanceOf(PdfPreviewSizeError);
});
it.each([
  ["wrong offset", () => partial(0, CHUNK)],
  ["changed document size", () => partial(CHUNK, 2 * CHUNK, 4 * CHUNK)],
  ["ignored range", () => response([new Uint8Array(CHUNK)]).response],
  [
    "truncated body",
    () =>
      response(
        [new Uint8Array(1)],
        { "content-range": `bytes ${CHUNK}-${2 * CHUNK - 1}/${3 * CHUNK}` },
        206
      ).response,
  ],
] as const)(
  "reports %s on a later range and stops further requests",
  async (_label, invalid) => {
    const fetch = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(partial())
      .mockResolvedValueOnce(invalid());
    const onError = jest.fn();
    const file = await fetchPdfPreview(
      url,
      new AbortController().signal,
      onError
    );
    if (!("range" in file)) throw new Error("Expected range loading");
    file.range.requestDataRange(CHUNK, 2 * CHUNK);
    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
    expect(file.range.onDataRange).not.toHaveBeenCalled();
    file.range.requestDataRange(CHUNK, 2 * CHUNK);
    expect(fetch).toHaveBeenCalledTimes(2);
  }
);
it("times out stalled later requests and aborts their network work", async () => {
  jest.useFakeTimers();
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(partial())
    .mockImplementationOnce(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true }
          );
        })
    );
  const onError = jest.fn();
  const file = await fetchPdfPreview(
    url,
    new AbortController().signal,
    onError
  );
  if (!("range" in file)) throw new Error("Expected range loading");
  file.range.requestDataRange(CHUNK, 2 * CHUNK);
  await jest.advanceTimersByTimeAsync(PDF_PREVIEW_TIMEOUT_MS);
  expect(onError).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[1]?.[1]?.signal?.aborted).toBe(true);
});
