/**
 * @jest-environment node
 */
import { randomHex, utf8Encode } from "@/lib/e2ee/bytes";
import {
  CHUNK_BUCKETS,
  chunkHash,
  deriveChunkKey,
  MAX_SEGMENT_BYTES,
  newBackupKey,
  openChunk,
  openEnvelope,
  sealChunk,
  sealEnvelope,
  ZERO_CHAIN_HASH,
} from "@/lib/e2ee/backup/crypto";
import { BackupError } from "@/lib/e2ee/backup/errors";
import { startE2eeBackup } from "@/lib/e2ee/backup";
import {
  decodeSegment,
  mergeSegments,
  packSegments,
} from "@/lib/e2ee/backup/format";
import {
  generateRecoveryCode,
  normalizeRecoveryCode,
  parseRecoveryCode,
} from "@/lib/e2ee/backup/recovery-code";

const codeOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return (error as BackupError).code;
  }
  return null;
};

describe("startE2eeBackup", () => {
  it("does nothing for an engine without backup support", () => {
    expect(startE2eeBackup({}, { profileId: "profile-1", wallet: "0x1" })).toBeNull();
  });
});

describe("E2EE backup recovery codes", () => {
  it("generates 256-bit codes in 14 groups of 4 that parse back", async () => {
    const { code, secret } = await generateRecoveryCode();
    expect(code).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){13}[0-9A-HJKMNP-TV-Z]{4}$/);
    expect(secret).toHaveLength(32);
    await expect(parseRecoveryCode(code)).resolves.toEqual(secret);
    // Spacing, case and look-alike letters are forgiven.
    const sloppy = code.toLowerCase().replaceAll("-", " ").replaceAll("0", "o");
    await expect(parseRecoveryCode(sloppy)).resolves.toEqual(secret);
  });

  it("rejects typos, truncation and foreign characters through the checksum", async () => {
    const { code } = await generateRecoveryCode();
    const raw = normalizeRecoveryCode(code);
    const flipped = raw[0] === "A" ? "B" : "A";
    await expect(parseRecoveryCode(flipped + raw.slice(1))).resolves.toBeNull();
    await expect(parseRecoveryCode(raw.slice(0, -1))).resolves.toBeNull();
    await expect(parseRecoveryCode(`${raw.slice(1)}U`)).resolves.toBeNull();
    await expect(parseRecoveryCode("")).resolves.toBeNull();
  });
});

describe("E2EE backup envelope and chunks", () => {
  const profileId = "profile-1";

  it("round-trips the backup key through the recovery code", async () => {
    const backupId = randomHex(16);
    const { secret } = await generateRecoveryCode();
    const backupKey = newBackupKey();
    const envelope = await sealEnvelope({
      recoverySecret: secret,
      backupKey,
      backupId,
      profileId,
    });
    await expect(
      openEnvelope({ envelope, recoverySecret: secret, backupId, profileId })
    ).resolves.toEqual(backupKey);
  });

  it("fails cleanly with E2EE_BACKUP_WRONG_CODE for another code, backup or profile", async () => {
    const backupId = randomHex(16);
    const { secret } = await generateRecoveryCode();
    const other = await generateRecoveryCode();
    const envelope = await sealEnvelope({
      recoverySecret: secret,
      backupKey: newBackupKey(),
      backupId,
      profileId,
    });
    await expect(
      codeOf(
        openEnvelope({
          envelope,
          recoverySecret: other.secret,
          backupId,
          profileId,
        })
      )
    ).resolves.toBe("E2EE_BACKUP_WRONG_CODE");
    await expect(
      codeOf(
        openEnvelope({
          envelope,
          recoverySecret: secret,
          backupId: randomHex(16),
          profileId,
        })
      )
    ).resolves.toBe("E2EE_BACKUP_WRONG_CODE");
    await expect(
      codeOf(
        openEnvelope({
          envelope,
          recoverySecret: secret,
          backupId,
          profileId: "someone-else",
        })
      )
    ).resolves.toBe("E2EE_BACKUP_WRONG_CODE");
    await expect(
      codeOf(
        openEnvelope({
          envelope: "bm90IGpzb24=",
          recoverySecret: secret,
          backupId,
          profileId,
        })
      )
    ).resolves.toBe("E2EE_BACKUP_CORRUPT");
  });

  it("pads chunks to buckets and decrypts only with the right key, backup and chain position", async () => {
    const backupId = randomHex(16);
    const key = await deriveChunkKey(newBackupKey(), backupId);
    const json = utf8Encode(JSON.stringify({ v: 2, hello: "world" }));
    const first = { epoch: 0, index: 0, prev: ZERO_CHAIN_HASH, base: null };
    const at0 = { index: 0, prev: ZERO_CHAIN_HASH };
    const sealed = await sealChunk(key, backupId, first, json);
    expect(sealed.length).toBe(CHUNK_BUCKETS[0]);
    await expect(openChunk(key, backupId, at0, sealed)).resolves.toEqual({
      link: first,
      json,
    });
    const large = new Uint8Array(MAX_SEGMENT_BYTES).fill(0x61);
    expect((await sealChunk(key, backupId, first, large)).length).toBe(
      1_048_576
    );
    await expect(
      codeOf(
        sealChunk(key, backupId, first, new Uint8Array(MAX_SEGMENT_BYTES + 1))
      )
    ).resolves.toBe("E2EE_BACKUP_SEGMENT_TOO_LARGE");

    const otherKey = await deriveChunkKey(newBackupKey(), backupId);
    await expect(
      codeOf(openChunk(otherKey, backupId, at0, sealed))
    ).resolves.toBe("E2EE_BACKUP_CORRUPT");
    await expect(
      codeOf(openChunk(key, randomHex(16), at0, sealed))
    ).resolves.toBe("E2EE_BACKUP_CORRUPT");
    const tampered = sealed.slice();
    tampered[100] = tampered[100]! ^ 1;
    await expect(codeOf(openChunk(key, backupId, at0, tampered))).resolves.toBe(
      "E2EE_BACKUP_CORRUPT"
    );

    // The aad binds the index and the previous chunk's hash.
    const prev = await chunkHash(sealed);
    const second = { epoch: 0, index: 1, prev, base: null };
    const next = await sealChunk(key, backupId, second, json);
    await expect(
      openChunk(key, backupId, { index: 1, prev }, next)
    ).resolves.toMatchObject({ link: second });
    await expect(
      codeOf(openChunk(key, backupId, { index: 2, prev }, next))
    ).resolves.toBe("E2EE_BACKUP_CORRUPT");
    const wrongPrev = prev.slice();
    wrongPrev[0] = wrongPrev[0]! ^ 1;
    await expect(
      codeOf(openChunk(key, backupId, { index: 1, prev: wrongPrev }, next))
    ).resolves.toBe("E2EE_BACKUP_CORRUPT");
    await expect(codeOf(openChunk(key, backupId, at0, next))).resolves.toBe(
      "E2EE_BACKUP_CORRUPT"
    );

    // Writers cannot seal malformed links.
    await expect(
      codeOf(sealChunk(key, backupId, { ...first, prev }, json))
    ).resolves.toBe("E2EE_BACKUP_CORRUPT");
    await expect(
      codeOf(
        sealChunk(
          key,
          backupId,
          { ...second, base: { index: 0, hash: prev } },
          json
        )
      )
    ).resolves.toBe("E2EE_BACKUP_CORRUPT");
  });

  it("packs records into bounded segments and later segments win on merge", () => {
    const g = randomHex(32);
    const message = (id: string, text: string) => ({
      id,
      g,
      seq: 1,
      kind: "message" as const,
      senderProfileId: "a",
      senderDeviceKey: null,
      ts: 1,
      serverTs: 1,
      text,
      mentions: [],
      reply: null,
      attachments: [],
      editedAt: null,
      deleted: false,
      reactions: {},
      sigOk: true,
      undecryptable: false,
      epoch: 1,
      body: null,
      sig: null,
    });
    const messages = Array.from({ length: 50 }, (_, i) =>
      message(`m${i}`, "x".repeat(200))
    );
    const segments = packSegments({ groups: [], messages }, 2000, 1);
    expect(segments.length).toBeGreaterThan(1);
    for (const segment of segments) {
      expect(segment.json.length).toBeLessThanOrEqual(2000);
    }
    const decoded = segments.map((segment) => decodeSegment(segment.json));
    expect(decoded.flatMap((s) => s.messages)).toHaveLength(50);
    const edited = decodeSegment(
      packSegments(
        { groups: [], messages: [message("m0", "edited")] },
        2000,
        2
      )[0]!.json
    );
    const merged = mergeSegments([...decoded, edited]);
    expect(merged.messages).toHaveLength(50);
    expect(merged.messages.find((m) => m.id === "m0")?.text).toBe("edited");
    // Malformed records are dropped, not fatal.
    const bad = decodeSegment(
      utf8Encode(JSON.stringify({ v: 2, groups: [{}], messages: [{ id: 1 }] }))
    );
    expect(bad).toMatchObject({ groups: [], messages: [] });
  });
});
