import { Blob as NodeBlob } from "node:buffer";
import { webcrypto } from "node:crypto";
import type { ApiArtworkDocumentationUploadSession } from "@/generated/models/ApiArtworkDocumentationUploadSession";
import {
  DocumentationFileChangedError,
  sha256Base64,
  transferDocumentationFile,
} from "@/lib/artwork-documentation/upload";
import {
  completeDocumentationUpload,
  signDocumentationParts,
} from "@/services/api/artwork-documentation-assets-api";

jest.mock("@/services/api/artwork-documentation-assets-api", () => ({
  signDocumentationParts: jest.fn(),
  completeDocumentationUpload: jest.fn(),
}));
const bytes = (value: string) => new NodeBlob([value]) as unknown as Blob;
const file = (value: string) =>
  Object.assign(bytes(value), {
    name: "original.tif",
    lastModified: 0,
  }) as File;
const session = (): ApiArtworkDocumentationUploadSession => ({
  upload_id: "upload",
  asset: {
    id: "upload",
    filename: "original.tif",
    size_bytes: 6,
    state: "uploading",
    role: "artwork_final",
    intended_visibility: "restricted",
  },
  policy: { part_size_bytes: 3, parallel_parts: 3 },
  received_parts: [],
  expires_at: 2000000000000,
});

describe("archival file transfer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(globalThis.crypto, "subtle", {
      configurable: true,
      value: webcrypto.subtle,
    });
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, headers: { get: () => '"part-etag"' } });
    jest
      .mocked(signDocumentationParts)
      .mockImplementation(async (_context, uploadId, parts) => ({
        upload_id: uploadId,
        parts: parts.map((part) => ({
          ...part,
          url: "https://storage.example.test/part",
          headers: { "x-amz-checksum-sha256": part.checksum_sha256 },
          size_bytes: 3,
          expires_at: 2000000000000,
        })),
      }));
    jest.mocked(completeDocumentationUpload).mockResolvedValue({
      asset: { ...session().asset, state: "processing" },
    });
  });

  it("checks accepted bytes before reusing parts and finalizes in part order", async () => {
    const upload = session();
    upload.received_parts = [
      {
        part_number: 1,
        size_bytes: 3,
        etag: '"first"',
        checksum_sha256: await sha256Base64(bytes("abc")),
      },
    ];
    const progress = jest.fn();
    await transferDocumentationFile({
      contextId: "context",
      session: upload,
      file: file("abcdef"),
      signal: new AbortController().signal,
      onProgress: progress,
    });
    expect(signDocumentationParts).toHaveBeenCalledTimes(1);
    expect(
      jest.mocked(signDocumentationParts).mock.calls[0]?.[2][0]?.part_number
    ).toBe(2);
    expect(jest.mocked(completeDocumentationUpload).mock.calls[0]?.[2]).toEqual(
      [
        {
          part_number: 1,
          etag: '"first"',
          checksum_sha256: await sha256Base64(bytes("abc")),
        },
        {
          part_number: 2,
          etag: '"part-etag"',
          checksum_sha256: await sha256Base64(bytes("def")),
        },
      ]
    );
    expect(progress).toHaveBeenLastCalledWith(6);
  });

  it("completes already accepted parts without forwarding response-only metadata", async () => {
    const upload = session();
    upload.asset.size_bytes = 5;
    upload.received_parts = [
      {
        part_number: 1,
        size_bytes: 3,
        etag: '"first"',
        checksum_sha256: await sha256Base64(bytes("abc")),
      },
      {
        part_number: 2,
        size_bytes: 2,
        etag: '"last-short-part"',
        checksum_sha256: await sha256Base64(bytes("de")),
      },
    ];
    const signal = new AbortController().signal;
    await transferDocumentationFile({
      contextId: "context",
      session: upload,
      file: file("abcde"),
      signal,
      onProgress: jest.fn(),
    });
    expect(signDocumentationParts).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(completeDocumentationUpload).toHaveBeenCalledWith(
      "context",
      "upload",
      [
        {
          part_number: 1,
          etag: '"first"',
          checksum_sha256: await sha256Base64(bytes("abc")),
        },
        {
          part_number: 2,
          etag: '"last-short-part"',
          checksum_sha256: await sha256Base64(bytes("de")),
        },
      ],
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      signal
    );
  });

  it("rejects a changed local file before signing or uploading any new part", async () => {
    const upload = session();
    upload.received_parts = [
      {
        part_number: 1,
        size_bytes: 3,
        etag: '"first"',
        checksum_sha256: await sha256Base64(bytes("abc")),
      },
    ];
    await expect(
      transferDocumentationFile({
        contextId: "context",
        session: upload,
        file: file("xyzdef"),
        signal: new AbortController().signal,
        onProgress: jest.fn(),
      })
    ).rejects.toBeInstanceOf(DocumentationFileChangedError);
    expect(signDocumentationParts).not.toHaveBeenCalled();
    expect(completeDocumentationUpload).not.toHaveBeenCalled();
  });

  it("does not call completion if object storage does not expose its part ETag", async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      headers: { get: () => null },
    } as unknown as Response);
    await expect(
      transferDocumentationFile({
        contextId: "context",
        session: session(),
        file: file("abcdef"),
        signal: new AbortController().signal,
        onProgress: jest.fn(),
      })
    ).rejects.toThrow("PART_UPLOAD_FAILED");
    expect(completeDocumentationUpload).not.toHaveBeenCalled();
  });
  it("aborts sibling parts and waits for them to settle before returning the first failure", async () => {
    let rejectFirst!: (error: unknown) => void;
    let rejectSibling!: (error: unknown) => void;
    let siblingSignal!: AbortSignal;
    jest
      .mocked(globalThis.fetch)
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
          })
      )
      .mockImplementationOnce((_url, init) => {
        siblingSignal = init!.signal!;
        return new Promise((_resolve, reject) => {
          rejectSibling = reject;
        });
      });
    const progress = jest.fn();
    let settled = false;
    const request = transferDocumentationFile({
      contextId: "context",
      session: session(),
      file: file("abcdef"),
      signal: new AbortController().signal,
      onProgress: progress,
    });
    const outcome = request.then(
      () => {
        settled = true;
      },
      (error: unknown) => {
        settled = true;
        return error;
      }
    );
    for (let attempt = 0; attempt < 100 && !rejectSibling; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 1));
    expect(rejectSibling).toBeDefined();
    const failure = new Error("first storage failure");
    rejectFirst(failure);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(siblingSignal.aborted).toBe(true);
    expect(settled).toBe(false);
    expect(progress).not.toHaveBeenCalled();
    rejectSibling(new DOMException("Aborted", "AbortError"));
    expect(await outcome).toBe(failure);
    expect(completeDocumentationUpload).not.toHaveBeenCalled();
  });
});
