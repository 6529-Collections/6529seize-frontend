import { TextDecoder } from "node:util";
import { documentationFixture } from "@/__tests__/fixtures/artwork-documentation";
import {
  documentationMediaAlternatives,
  fetchDocumentationCaptions,
} from "@/lib/artwork-documentation/media-alternatives";
import type { ApiArtworkDocumentationAsset } from "@/generated/models/ApiArtworkDocumentationAsset";

const originalFetch = globalThis.fetch;
beforeAll(() =>
  Object.defineProperty(globalThis, "TextDecoder", {
    configurable: true,
    value: TextDecoder,
  })
);
afterEach(() => {
  globalThis.fetch = originalFetch;
});
function response(chunks: Uint8Array[], ok = true) {
  const reader = {
    read: jest.fn(async () =>
      chunks.length ? { done: false, value: chunks.shift()! } : { done: true }
    ),
    cancel: jest.fn(async () => {}),
    releaseLock: jest.fn(),
  };
  globalThis.fetch = jest.fn(async () => ({
    ok,
    body: { getReader: () => reader },
  })) as unknown as typeof fetch;
  return reader;
}
it("decodes bounded WebVTT bytes without forwarding application credentials", async () => {
  const reader = response([
    Buffer.from("WEBVTT\n\n00:00.000 --> 00:01.000\nA supplied caption.\n"),
  ]);
  const signal = new AbortController().signal;
  expect(
    (
      await fetchDocumentationCaptions(
        "https://storage.invalid/captions",
        signal
      )
    ).type
  ).toBe("text/vtt");
  expect(fetch).toHaveBeenCalledWith("https://storage.invalid/captions", {
    signal,
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
  });
  expect(reader.cancel).toHaveBeenCalled();
});
it.each([
  Buffer.from("<html>not captions</html>"),
  new Uint8Array([0xff]),
  new Uint8Array(2 * 1024 * 1024 + 1),
])(
  "rejects invalid or excessive caption bytes before creating a URL",
  async (bytes) => {
    const reader = response([bytes]);
    await expect(
      fetchDocumentationCaptions(
        "https://storage.invalid/captions",
        new AbortController().signal
      )
    ).rejects.toThrow();
    expect(reader.cancel).toHaveBeenCalled();
  }
);
it("rejects a denied caption download", async () => {
  response([], false);
  await expect(
    fetchDocumentationCaptions(
      "https://storage.invalid/captions",
      new AbortController().signal
    )
  ).rejects.toThrow("unavailable");
});
it("selects exact media relationships and never borrows a draft transcript for publication", () => {
  const context = documentationFixture();
  const video = { id: "video" } as ApiArtworkDocumentationAsset;
  const caption = {
    id: "caption",
    state: "ready",
    filename: "captions.vtt",
    detected_mime: "text/vtt",
  } as ApiArtworkDocumentationAsset;
  context.assets = [video, caption];
  context.asset_links = [
    {
      asset_id: caption.id,
      role: "captions",
      derived_from_asset_ids: [video.id],
    },
  ] as never;
  context.modules["interview"]!.answers["sessions"] = {
    status: "provided",
    value: [
      {
        id: "interview",
        recording_asset_ids: [video.id],
        transcript_text: "The complete supplied transcript.",
        language: "en",
      },
      {
        id: "unrelated",
        recording_asset_ids: ["other"],
        transcript_text: "Unrelated text",
      },
    ],
  } as never;
  const alternatives = documentationMediaAlternatives(context, video);
  expect(alternatives.captions.map((item) => item.asset.id)).toEqual([
    caption.id,
  ]);
  expect(alternatives.transcripts.map((item) => item.text)).toEqual([
    "The complete supplied transcript.",
  ]);
  expect(
    documentationMediaAlternatives(context, video, {
      modules: {},
      asset_links: [],
    } as never)
  ).toEqual({ captions: [], transcripts: [] });
  context.capabilities.read_archival_files = false;
  expect(documentationMediaAlternatives(context, video).captions).toEqual([]);
  expect(
    documentationMediaAlternatives(context, video).transcripts
  ).toHaveLength(1);
});
