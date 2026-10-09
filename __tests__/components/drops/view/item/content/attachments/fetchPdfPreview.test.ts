import { ReadableStream } from "node:stream/web";
import {
  fetchPdfPreview,
  PDF_PREVIEW_MAX_BYTES,
  PdfPreviewSizeError,
} from "@/components/drops/view/item/content/attachments/fetchPdfPreview";

const url = "https://media.example.test/document.pdf";
function response(chunks: Uint8Array[], headers: Record<string, string> = {}) {
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
      ok: true,
      headers: new Headers(headers),
      body,
    } as unknown as Response,
    cancel,
  };
}
afterEach(() => jest.restoreAllMocks());

it("reads PDF bytes without credentials or a referrer", async () => {
  const fixture = response([new Uint8Array([1, 2]), new Uint8Array([3])]);
  const fetch = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(fixture.response);
  const { signal } = new AbortController();
  await expect(fetchPdfPreview(url, signal)).resolves.toEqual(
    new Uint8Array([1, 2, 3])
  );
  expect(fetch).toHaveBeenCalledWith(url, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
});
it("rejects unavailable documents", async () => {
  jest.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false } as Response);
  await expect(
    fetchPdfPreview(url, new AbortController().signal)
  ).rejects.toThrow("PDF request failed");
});
it.each([true, false])(
  "bounds oversized PDFs with declared length %s",
  async (declared) => {
    const fixture = response(
      [new Uint8Array(PDF_PREVIEW_MAX_BYTES + 1)],
      declared ? { "content-length": String(PDF_PREVIEW_MAX_BYTES + 1) } : {}
    );
    jest.spyOn(globalThis, "fetch").mockResolvedValue(fixture.response);
    await expect(
      fetchPdfPreview(url, new AbortController().signal)
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
  await expect(fetchPdfPreview(url, controller.signal)).rejects.toMatchObject({
    name: "AbortError",
  });
});
