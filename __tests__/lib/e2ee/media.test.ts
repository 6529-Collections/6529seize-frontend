/**
 * @jest-environment node
 */
import {
  createFakeApiClient,
  createFakeDeliveryService,
} from "@/tests/support/e2ee/fakeDeliveryService.cjs";

import { base64ToBytes, randomBytes } from "@/lib/e2ee/bytes";
import { markGifPickerFile } from "@/lib/e2ee/gif-picker-files";
import {
  BLOB_CHUNK_BYTES,
  chunkAad,
  chunkNonce,
  ciphertextSize,
  decryptMedia,
  downloadMedia,
  encryptMedia,
  isInlineMime,
  isSafeInlineImageMime,
  isWithinAttachmentLimits,
  localBlobType,
  MAX_ATTACHMENT_BYTES,
  MAX_BLOB_BYTES,
  MAX_BLOB_CHUNKS,
  mediaFromFile,
  MediaError,
  PLAINTEXT_CHUNK_BYTES,
  uploadMedia,
} from "@/lib/e2ee/media";

describe("media (contract 6)", () => {
  it("derives chunk nonces by XOR of the last 4 bytes", () => {
    const base = new Uint8Array(12).fill(0xff);
    expect([...chunkNonce(base, 0)]).toEqual(new Array(12).fill(0xff));
    const one = chunkNonce(base, 0x01020304);
    expect([...one.slice(0, 8)]).toEqual(new Array(8).fill(0xff));
    expect([...one.slice(8)]).toEqual([0xfe, 0xfd, 0xfc, 0xfb]);
    expect(() => chunkNonce(new Uint8Array(11), 0)).toThrow(MediaError);
  });

  it("builds the AAD", () => {
    const aad = chunkAad(2, 5);
    expect(new TextDecoder().decode(aad.slice(0, 17))).toBe(
      "6529-e2ee-blob-v1"
    );
    expect([...aad.slice(17)]).toEqual([0, 0, 0, 2, 0, 0, 0, 5]);
  });

  it("round-trips multi-chunk media and keeps chunks within 1 MiB", async () => {
    const plaintext = randomBytes(PLAINTEXT_CHUNK_BYTES * 2 + 1234);
    const sealed = await encryptMedia(plaintext);
    expect(sealed.chunks).toHaveLength(3);
    for (const chunk of sealed.chunks) {
      expect(chunk.length).toBeLessThanOrEqual(BLOB_CHUNK_BYTES);
    }
    expect(sealed.chunks.reduce((sum, c) => sum + c.length, 0)).toBe(
      ciphertextSize(plaintext.length)
    );
    const opened = await decryptMedia(sealed.chunks, sealed.key, sealed.nonce);
    expect(opened).toEqual(plaintext);
  });

  it("detects reordered or tampered chunks", async () => {
    const sealed = await encryptMedia(randomBytes(PLAINTEXT_CHUNK_BYTES + 10));
    await expect(
      decryptMedia(
        [sealed.chunks[1]!, sealed.chunks[0]!],
        sealed.key,
        sealed.nonce
      )
    ).rejects.toThrow("E2EE_MEDIA_DECRYPT");
    await expect(
      decryptMedia([sealed.chunks[0]!], sealed.key, sealed.nonce)
    ).rejects.toThrow("E2EE_MEDIA_DECRYPT");
    const tampered = new Uint8Array(sealed.chunks[0]!);
    tampered[5] = (tampered[5] ?? 0) ^ 1;
    await expect(
      decryptMedia([tampered, sealed.chunks[1]!], sealed.key, sealed.nonce)
    ).rejects.toThrow("E2EE_MEDIA_DECRYPT");
  });

  it("encrypts empty files as one chunk and refuses files over 25 MiB", async () => {
    const sealed = await encryptMedia(new Uint8Array(0));
    expect(sealed.chunks).toHaveLength(1);
    await expect(
      decryptMedia(sealed.chunks, sealed.key, sealed.nonce)
    ).resolves.toEqual(new Uint8Array(0));
    await expect(encryptMedia(new Uint8Array(MAX_BLOB_BYTES))).rejects.toThrow(
      "E2EE_TOO_LARGE"
    );
  });

  it("classifies inline types", () => {
    expect(isInlineMime("image/png")).toBe(true);
    expect(isInlineMime("video/mp4")).toBe(true);
    expect(isInlineMime("audio/ogg")).toBe(true);
    expect(isInlineMime("application/pdf")).toBe(true);
    expect(isInlineMime("text/plain")).toBe(true);
    expect(isInlineMime("text/html")).toBe(false);
    expect(isInlineMime("application/zip")).toBe(false);
  });

  it("uploads through the blob endpoints and downloads again", async () => {
    const ds = createFakeDeliveryService();
    const api = createFakeApiClient(ds, "p1");
    // Minimal fixtures: a device and a group so the blob routes accept us.
    const deviceKey = `0x${"ab".repeat(32)}`;
    ds.state["devices"].set(deviceKey, {
      device_key: deviceKey,
      profile_id: "p1",
      grant: { expires_at: Math.floor(Date.now() / 1000) + 3600 },
      revoked_at: null,
    });
    const g = `0x${"cd".repeat(32)}`;
    await api.createGroup({
      group: g,
      commit_key: `0x${"ef".repeat(32)}`,
      creator_device_key: deviceKey,
    });
    const bytes = randomBytes(PLAINTEXT_CHUNK_BYTES + 99);
    const attachment = await uploadMedia({
      api,
      g,
      deviceKey,
      media: { bytes, mime: "image/png", name: "x.png", width: 2, height: 1 },
    });
    expect(attachment).toMatchObject({
      chunks: 2,
      mime: "image/png",
      size: bytes.length,
      w: 2,
      h: 1,
    });
    expect(base64ToBytes(attachment.k)).toHaveLength(32);
    expect(base64ToBytes(attachment.n)).toHaveLength(12);
    await expect(
      downloadMedia({ api, deviceKey, attachment })
    ).resolves.toEqual(bytes);
    await expect(
      downloadMedia({ api, deviceKey, attachment: { ...attachment, size: 1 } })
    ).rejects.toThrow("E2EE_MEDIA_SIZE");
  });
});

describe("local blob types for decrypted attachments", () => {
  it("keeps raster image types and neutralises everything else", () => {
    expect(localBlobType("image/png")).toBe("image/png");
    expect(localBlobType("IMAGE/JPEG")).toBe("image/jpeg");
    for (const risky of [
      "text/html",
      "image/svg+xml",
      "application/javascript",
      "application/xhtml+xml",
      "text/plain",
      "application/pdf",
    ]) {
      expect(localBlobType(risky)).toBe("application/octet-stream");
      expect(isSafeInlineImageMime(risky)).toBe(false);
    }
  });
});

describe("attachment limits", () => {
  it("match what encryptMedia can produce", () => {
    expect(MAX_BLOB_CHUNKS).toBe(25);
    expect(ciphertextSize(MAX_ATTACHMENT_BYTES)).toBe(MAX_BLOB_BYTES);
    expect(ciphertextSize(MAX_ATTACHMENT_BYTES + 1)).toBeGreaterThan(
      MAX_BLOB_BYTES
    );
    expect(
      Math.ceil(MAX_ATTACHMENT_BYTES / PLAINTEXT_CHUNK_BYTES)
    ).toBeLessThanOrEqual(MAX_BLOB_CHUNKS);
  });

  it.each([
    [{ size: 0, chunks: 1 }, true],
    [{ size: MAX_ATTACHMENT_BYTES, chunks: MAX_BLOB_CHUNKS }, true],
    [{ size: MAX_ATTACHMENT_BYTES + 1, chunks: 1 }, false],
    [{ size: 10, chunks: MAX_BLOB_CHUNKS + 1 }, false],
    [{ size: 10, chunks: 0 }, false],
  ])("%o within limits: %s", (attachment, expected) => {
    expect(isWithinAttachmentLimits(attachment)).toBe(expected);
  });

  it("refuses an oversized declaration before downloading anything", async () => {
    const getBlobChunk = jest.fn();
    const api = { getBlobChunk } as unknown as Parameters<
      typeof downloadMedia
    >[0]["api"];
    const attachment = {
      blob: "0x0123456789abcdef0123456789abcdef",
      k: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      n: "AAAAAAAAAAAAAAAA",
      chunks: 1_000_000,
      mime: "image/png",
      size: 10,
      name: "image.png",
    };
    await expect(
      downloadMedia({ api, deviceKey: "0xab", attachment })
    ).rejects.toThrow("E2EE_MEDIA_SIZE");
    expect(getBlobChunk).not.toHaveBeenCalled();
  });
});

describe("mediaFromFile", () => {
  const bytesOf = (value: string) =>
    Uint8Array.from(value, (char) => char.codePointAt(0) ?? 0);
  const segment = (marker: number, payload: Uint8Array) =>
    Uint8Array.of(
      0xff,
      marker,
      (payload.length + 2) >> 8,
      (payload.length + 2) & 0xff,
      ...payload
    );
  /** A JPEG whose comment names a place, and a frame and scan to decode. */
  const photo = Uint8Array.of(
    0xff,
    0xd8,
    ...segment(0xfe, bytesOf("Home, 51.5N 0.1W")),
    ...segment(0xc0, Uint8Array.of(8, 0, 1, 0, 1, 1, 1, 0x11, 0)),
    ...segment(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0)),
    0x12,
    0xff,
    0xd9
  );
  const hasPlace = (bytes: Uint8Array) =>
    new TextDecoder("latin1").decode(bytes).includes("51.5N");
  const originalBitmap = globalThis.createImageBitmap;

  afterEach(() => {
    globalThis.createImageBitmap = originalBitmap;
  });

  it("sends a photo without its metadata under a neutral name", async () => {
    const media = await mediaFromFile(
      new File([photo], "IMG_20261109_home.jpg", { type: "image/jpeg" })
    );
    expect(hasPlace(photo)).toBe(true);
    expect(hasPlace(media.bytes)).toBe(false);
    expect(media.name).toBe("image.jpg");
    expect(media.mime).toBe("image/jpeg");
  });

  it("sends other files unchanged under their own name", async () => {
    const pdf = bytesOf("%PDF-1.7 Home, 51.5N 0.1W");
    const media = await mediaFromFile(
      new File([pdf], "report.pdf", { type: "application/pdf" })
    );
    expect(media.bytes).toEqual(pdf);
    expect(media.name).toBe("report.pdf");
  });

  it("sends an image it cannot clean unchanged", async () => {
    const odd = bytesOf("not really a jpeg");
    const media = await mediaFromFile(
      new File([odd], "x.jpg", { type: "image/jpeg" })
    );
    expect(media.bytes).toEqual(odd);
    expect(media.name).toBe("image.jpg");
  });

  it("sends a GIF from the GIF picker as downloaded, under its own name", async () => {
    // A 1x1 GIF whose comment block a user's own GIF would lose.
    const gif = Uint8Array.of(
      ...bytesOf("GIF89a"),
      1,
      0,
      1,
      0,
      0,
      0,
      0,
      0x21,
      0xfe,
      5,
      ...bytesOf("51.5N"),
      0,
      0x2c,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      2,
      2,
      0x44,
      0x01,
      0,
      0x3b
    );
    const picked = await mediaFromFile(
      markGifPickerFile(new File([gif], "giphy.gif", { type: "image/gif" }))
    );
    expect(picked.bytes).toEqual(gif);
    expect(picked.name).toBe("giphy.gif");

    const own = await mediaFromFile(
      new File([gif], "giphy.gif", { type: "image/gif" })
    );
    expect(hasPlace(own.bytes)).toBe(false);
    expect(own.name).toBe("image.gif");
  });

  it("falls back to the original when the cleaned copy does not decode", async () => {
    const file = new File([photo], "x.jpg", { type: "image/jpeg" });
    globalThis.createImageBitmap = jest.fn(async (source: unknown) => {
      if (source === file) {
        return { width: 4, height: 3, close: () => undefined };
      }
      throw new Error("decode failed");
    }) as unknown as typeof createImageBitmap;
    const media = await mediaFromFile(file);
    expect(media.bytes).toEqual(photo);
    expect(media).toMatchObject({ width: 4, height: 3, name: "image.jpg" });
  });
});
