/** @jest-environment node */

jest.mock("node:dns/promises", () => ({ lookup: jest.fn() }));
const mockFetch = jest.fn();
jest.mock("undici", () => ({
  Agent: jest.fn(() => ({ dispatch: jest.fn() })),
  fetch: (...args: unknown[]) => mockFetch(...args),
}));

import { lookup } from "node:dns/promises";
import type { LookupAddress, LookupAllOptions } from "node:dns";
import {
  fetchTokenUriJson,
  TOKEN_URI_MAX_BYTES,
} from "@/app/api/open-graph/tokenUriMetadata";
import { BodyTooLargeError } from "@/lib/fetch/limitedBody";
import { AdmissionQueueError } from "@/lib/fetch/admissionQueue";
import { PUBLIC_URL_OPTIONS } from "@/app/api/open-graph/publicUrlOptions";

const lookupAll: (
  hostname: string,
  options: LookupAllOptions
) => Promise<LookupAddress[]> = lookup;
const mockLookup = jest.mocked(lookupAll);
const url = new URL("https://metadata.example/nft/1");

describe("NFT metadata transport", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockLookup.mockReset();
    mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  });

  it("accepts public metadata with a missing or unconventional MIME type", async () => {
    mockFetch.mockResolvedValue(
      new Response('{"image":"ipfs://art","name":"Artwork"}', {
        headers: { "content-type": "application/octet-stream" },
      })
    );
    await expect(fetchTokenUriJson(url, {})).resolves.toEqual({
      image: "ipfs://art",
      name: "Artwork",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      url.toString(),
      expect.objectContaining({ redirect: "manual" })
    );
  });

  it("rejects redirect destinations on private networks before fetching them", async () => {
    const cancel = jest.fn();
    mockFetch.mockResolvedValue(
      new Response(new ReadableStream({ cancel }), {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data/" },
      })
    );
    await expect(fetchTokenUriJson(url, {})).rejects.toMatchObject({
      kind: "ip-not-allowed",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("applies the preview host policy again on each redirect", async () => {
    mockFetch.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://publicly-resolving.internal/metadata" },
      })
    );
    await expect(
      fetchTokenUriJson(url, { policy: { blockedHostSuffixes: [".internal"] } })
    ).rejects.toMatchObject({ kind: "host-not-allowed" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("cancels an oversized declared body before reading any metadata", async () => {
    const cancel = jest.fn();
    mockFetch.mockResolvedValue(
      new Response(new ReadableStream({ cancel }), {
        headers: { "content-length": String(TOKEN_URI_MAX_BYTES + 1) },
      })
    );
    await expect(fetchTokenUriJson(url, {})).rejects.toBeInstanceOf(
      BodyTooLargeError
    );
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("counts decompressed stream bytes even when the server declares a tiny length", async () => {
    const cancel = jest.fn();
    const chunk = new TextEncoder().encode(" ".repeat(1024 * 1024));
    let reads = 0;
    mockFetch.mockResolvedValue(
      new Response(
        new ReadableStream(
          {
            pull(controller) {
              reads += 1;
              controller.enqueue(chunk);
            },
            cancel,
          },
          { highWaterMark: 0 }
        ),
        { headers: { "content-length": "1", "content-encoding": "gzip" } }
      )
    );
    await expect(fetchTokenUriJson(url, {})).rejects.toBeInstanceOf(
      BodyTooLargeError
    );
    expect(reads).toBe(Math.floor(TOKEN_URI_MAX_BYTES / chunk.byteLength) + 1);
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("stops reading at 1 MiB and never parses an oversized document", async () => {
    expect(TOKEN_URI_MAX_BYTES).toBe(1024 * 1024);
    const parse = jest.spyOn(JSON, "parse");
    const chunk = new TextEncoder().encode("[".repeat(256 * 1024));
    try {
      mockFetch.mockResolvedValue(
        new Response(
          new ReadableStream({
            pull(controller) {
              controller.enqueue(chunk);
            },
          })
        )
      );
      await expect(fetchTokenUriJson(url, {})).rejects.toBeInstanceOf(
        BodyTooLargeError
      );
      expect(parse).not.toHaveBeenCalled();
    } finally {
      parse.mockRestore();
    }
  });

  it("refuses a redirect to a port other than 80 or 443", async () => {
    mockFetch.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://metadata.example:8443/nft/1" },
      })
    );
    await expect(
      fetchTokenUriJson(url, PUBLIC_URL_OPTIONS)
    ).rejects.toMatchObject({ kind: "host-not-allowed" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("stops waiting for admission when the caller goes away", async () => {
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    mockFetch.mockResolvedValueOnce(new Response(stream.readable));
    const admitted = fetchTokenUriJson(url, {});
    const controller = new AbortController();
    const queued = fetchTokenUriJson(url, {}, controller.signal);
    controller.abort();
    await expect(queued).rejects.toBeInstanceOf(AdmissionQueueError);
    await writer.write(new TextEncoder().encode('{"name":"Artwork"}'));
    await writer.close();
    await expect(admitted).resolves.toEqual({ name: "Artwork" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("waits for the active metadata body before fetching the next preview", async () => {
    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();
    mockFetch
      .mockResolvedValueOnce(new Response(stream.readable))
      .mockResolvedValueOnce(new Response('{"name":"Next artwork"}'));
    const admitted = fetchTokenUriJson(url, {});
    const queued = fetchTokenUriJson(url, {});
    await writer.write(new TextEncoder().encode('{"name":"Artwork"}'));
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await writer.close();
    await expect(admitted).resolves.toEqual({ name: "Artwork" });
    await expect(queued).resolves.toEqual({
      name: "Next artwork",
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("releases metadata admission after a failed fetch", async () => {
    mockFetch.mockRejectedValueOnce(new Error("upstream unavailable"));
    await expect(fetchTokenUriJson(url, {})).rejects.toThrow();
    mockFetch.mockResolvedValueOnce(new Response('{"name":"Artwork"}'));
    await expect(fetchTokenUriJson(url, {})).resolves.toEqual({
      name: "Artwork",
    });
  });
});
