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
const session = (): ApiArtworkDocumentationUploadSession =>
  ({
    upload_id: "upload",
    asset: { id: "upload", size_bytes: 6 },
    policy: { part_size_bytes: 3, parallel_parts: 3 },
    received_parts: [],
    expires_at: 2000000000000,
  }) as ApiArtworkDocumentationUploadSession;

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
      asset: { id: "upload", state: "processing" },
    } as Awaited<ReturnType<typeof completeDocumentationUpload>>);
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
    expect(
      jest
        .mocked(completeDocumentationUpload)
        .mock.calls[0]?.[2].map((part) => part.part_number)
    ).toEqual([1, 2]);
    expect(progress).toHaveBeenLastCalledWith(6);
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
});
