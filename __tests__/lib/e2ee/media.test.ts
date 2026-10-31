/**
 * @jest-environment node
 */
import {
  createFakeApiClient,
  createFakeDeliveryService,
} from "@/tests/support/e2ee/fakeDeliveryService.cjs";

import { base64ToBytes, randomBytes } from "@/lib/e2ee/bytes";
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
  localBlobType,
  MAX_BLOB_BYTES,
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
