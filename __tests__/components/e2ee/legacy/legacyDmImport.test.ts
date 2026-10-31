import type { LegacyDmItem } from "@/components/e2ee/legacy/legacyDmExport";
import {
  chunkText,
  fitsEncryptedAttachment,
  IMPORT_TEXT_CHUNK,
  pauseReason,
  planLegacyImport,
  runLegacyDmImport,
  type LegacyImportDeps,
} from "@/components/e2ee/legacy/legacyDmImport";
import { safeAttachmentName } from "@/lib/e2ee/attachment-name";
import { E2eeApiError } from "@/lib/e2ee/api";
import { E2eeError } from "@/lib/e2ee/engine/errors";
import {
  ciphertextSize,
  encryptMedia,
  MAX_BLOB_BYTES,
  PLAINTEXT_CHUNK_BYTES,
} from "@/lib/e2ee/media";
import type { E2eeImported, E2eeMessage } from "@/lib/e2ee/types";

const CDN = "https://d3lqz0a4bldqgf.cloudfront.net/drops/u1";

function item(n: number, overrides: Partial<LegacyDmItem> = {}): LegacyDmItem {
  return {
    legacy_drop_id: `drop-${n}`,
    serial_no: n,
    author: {
      profile_id: n % 2 ? "alice-id" : "bob-id",
      handle: n % 2 ? "alice" : "bob",
    },
    created_at: 1_700_000_000_000 + n,
    updated_at: null,
    title: null,
    reply_to: null,
    parts: [
      {
        text: `message ${n}`,
        quoted_drop_id: null,
        media: [],
        attachments: [],
      },
    ],
    mentions: [],
    reactions: [],
    ...overrides,
  };
}

interface Sent {
  readonly text: string;
  readonly imported: E2eeImported;
  readonly reply: string | null;
  readonly files: File[];
}

function deps(
  options: {
    existing?: E2eeMessage[];
    attachments?: boolean;
    failOn?: (input: Sent) => Error | null;
    media?: (url: string) => Blob;
  } = {}
) {
  const sent: Sent[] = [];
  const messages: E2eeMessage[] = [...(options.existing ?? [])];
  const value: LegacyImportDeps = {
    engine: {
      getAttachmentsEnabled: () => options.attachments ?? true,
      getMessages: () => messages,
      sendImported: jest.fn(async (_g: string, input) => {
        const record: Sent = {
          text: input.text,
          imported: input.imported,
          reply: input.reply ?? null,
          files: input.files ?? [],
        };
        const error = options.failOn?.(record);
        if (error) {
          throw error;
        }
        sent.push(record);
        messages.push({
          id: `e2ee-${sent.length}`,
          imported: input.imported,
          deleted: false,
        } as E2eeMessage);
      }),
    },
    fetchMedia: jest.fn(async (url: string) =>
      options.media
        ? options.media(url)
        : new Blob(["png"], { type: "image/png" })
    ),
    sleep: jest.fn(async () => undefined),
  };
  return { value, sent };
}

const run = (
  items: LegacyDmItem[],
  d: LegacyImportDeps,
  signal = new AbortController().signal
) => runLegacyDmImport({ g: "g1", waveId: "wave-1", items, deps: d, signal });

/** The largest file whose ciphertext fits one encrypted attachment. */
function largestMovableBytes(): number {
  let low = 0;
  let high = MAX_BLOB_BYTES;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (ciphertextSize(mid) <= MAX_BLOB_BYTES) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low;
}

describe("encrypted attachment size", () => {
  it("uses the engine's exact overhead: 16 bytes per encrypted chunk", () => {
    const limit = largestMovableBytes();
    const chunks = Math.ceil(limit / PLAINTEXT_CHUNK_BYTES);
    expect(limit + chunks * 16).toBeLessThanOrEqual(MAX_BLOB_BYTES);
    expect(fitsEncryptedAttachment(limit)).toBe(true);
    expect(fitsEncryptedAttachment(limit + 1)).toBe(false);
  });

  it("agrees with the engine's own refusal", async () => {
    const limit = largestMovableBytes();
    await expect(encryptMedia(new Uint8Array(limit + 1))).rejects.toMatchObject(
      { code: "E2EE_TOO_LARGE" }
    );
  });

  it("classifies pauses by the error the engine propagates", () => {
    expect(
      pauseReason(
        new E2eeApiError({
          message: "",
          status: 429,
          code: "E2EE_RATE_LIMITED",
        })
      )
    ).toBe("rate");
    expect(
      pauseReason(new E2eeApiError({ message: "", status: 429, code: null }))
    ).toBe("rate");
    expect(
      pauseReason(
        new E2eeApiError({ message: "", status: 413, code: "E2EE_TOO_LARGE" })
      )
    ).toBe("storage");
    expect(pauseReason(new E2eeError("E2EE_ATTACHMENTS_DISABLED"))).toBeNull();
    expect(pauseReason(new Error("boom"))).toBeNull();
  });
});

describe("planLegacyImport", () => {
  it.each([
    ["holiday.png", "holiday.png"],
    ["../../etc/passwd", "_.._etc_passwd"],
    ["a\\b/c.pdf", "a_b_c.pdf"],
    ["evil‮gnp.exe", "evilgnp.exe"],
    ["line\nbreak\u0000.txt", "linebreak.txt"],
    ["  ...  ", "file"],
    ["", "file"],
  ])("normalizes the attachment name %j", (raw, expected) => {
    expect(safeAttachmentName(raw, "file")).toBe(expected);
  });

  it("caps long names and keeps the extension", () => {
    const name = safeAttachmentName(`${"x".repeat(300)}.jpeg`, "file");
    expect([...name]).toHaveLength(120);
    expect(name.endsWith(".jpeg")).toBe(true);
  });

  it("normalizes names taken from the CDN path and the legacy record", () => {
    const [unit] = planLegacyImport([
      item(1, {
        parts: [
          {
            text: "x",
            quoted_drop_id: null,
            media: [{ url: `${CDN}/a%2Fb%0A.png`, mime_type: "image/png" }],
            attachments: [
              {
                file_name: "../secret‮.pdf",
                mime_type: "application/pdf",
                url: "https://cdn.example/f.pdf",
              },
            ],
          },
        ],
      }),
    ]);
    expect(unit!.media.map((m) => m.name)).toEqual(["a_b.png", "_secret.pdf"]);
  });

  it("splits long text without breaking characters", () => {
    const text = "😀".repeat(IMPORT_TEXT_CHUNK + 5);
    const chunks = chunkText(text, IMPORT_TEXT_CHUNK);
    expect(chunks).toHaveLength(2);
    expect([...chunks[1]!]).toHaveLength(5);
    expect(chunks.join("")).toBe(text);
  });

  it("makes one message per part and carries media on the first chunk", () => {
    const units = planLegacyImport([
      item(1, {
        title: "Title",
        parts: [
          {
            text: "a".repeat(IMPORT_TEXT_CHUNK + 1),
            quoted_drop_id: null,
            media: [{ url: `${CDN}/one.png`, mime_type: "image/png" }],
            attachments: [],
          },
          {
            text: "second",
            quoted_drop_id: null,
            media: [],
            attachments: [
              { file_name: "a.pdf", mime_type: "application/pdf", url: null },
            ],
          },
        ],
      }),
    ]);
    expect(units.map((u) => u.part)).toEqual([0, 1, 2]);
    expect(units[0]!.text.startsWith("Title\n\n")).toBe(true);
    expect(units[0]!.media).toEqual([
      { url: `${CDN}/one.png`, name: "one.png", mime: "image/png" },
    ]);
    expect(units[1]!.media).toEqual([]);
    expect(units[2]!.media).toEqual([]);
  });
});

describe("runLegacyDmImport", () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  it("sends every message oldest first, labelled with its origin", async () => {
    const { value, sent } = deps();
    const result = await run(
      [item(2), item(1)].sort((a, b) => a.serial_no - b.serial_no),
      value
    );
    expect(result).toMatchObject({
      outcome: "done",
      total: 2,
      sent: 2,
      skipped: 0,
      failed: 0,
    });
    expect(sent.map((s) => s.imported.dropId)).toEqual(["drop-1", "drop-2"]);
    expect(sent[0]!.imported).toMatchObject({
      waveId: "wave-1",
      authorProfileId: "alice-id",
      authorHandle: "alice",
      createdAt: 1_700_000_000_001,
    });
    expect(value.sleep).toHaveBeenCalledTimes(2);
  });

  it("resumes: skips originals already in the chat", async () => {
    const existing = [
      {
        id: "x",
        deleted: false,
        imported: { waveId: "wave-1", dropId: "drop-1", part: 0 },
      },
      {
        id: "y",
        deleted: false,
        imported: { waveId: "other-wave", dropId: "drop-2", part: 0 },
      },
    ] as E2eeMessage[];
    const { value, sent } = deps({ existing });
    const result = await run([item(1), item(2)], value);
    expect(result).toMatchObject({ sent: 1, skipped: 1 });
    expect(sent.map((s) => s.imported.dropId)).toEqual(["drop-2"]);
  });

  it("points replies at the encrypted copy of their target", async () => {
    const { value, sent } = deps();
    await run(
      [item(1), item(2, { reply_to: "drop-1" }), item(3, { reply_to: "gone" })],
      value
    );
    expect(sent.map((s) => s.reply)).toEqual([null, "e2ee-1", null]);
  });

  it("moves images as encrypted attachments", async () => {
    const { value, sent } = deps();
    const result = await run(
      [
        item(1, {
          parts: [
            {
              text: "",
              quoted_drop_id: null,
              media: [{ url: `${CDN}/a.png`, mime_type: "image/png" }],
              attachments: [],
            },
          ],
        }),
      ],
      value
    );
    expect(sent[0]!.files).toHaveLength(1);
    expect(sent[0]!.files[0]!.name).toBe("a.png");
    expect(result).toMatchObject({ mediaMoved: 1, mediaNotMoved: 0 });
    expect(sent[0]!.imported.mediaNotImported).toBe(0);
  });

  it("sends text and counts media as not moved when attachments are off", async () => {
    const { value, sent } = deps({ attachments: false });
    const result = await run(
      [
        item(1, {
          parts: [
            {
              text: "hi",
              quoted_drop_id: null,
              media: [{ url: `${CDN}/a.png`, mime_type: "image/png" }],
              attachments: [],
            },
          ],
        }),
      ],
      value
    );
    expect(value.fetchMedia).not.toHaveBeenCalled();
    expect(sent[0]!.files).toEqual([]);
    expect(sent[0]!.imported.mediaNotImported).toBe(1);
    expect(result.mediaNotMoved).toBe(1);
  });

  it("marks media that cannot be fetched or is too large", async () => {
    const { value, sent } = deps({
      media: (url) => {
        if (url.endsWith("broken.png")) {
          throw new Error("404");
        }
        return { size: 30 * 1024 * 1024, type: "video/mp4" } as Blob;
      },
    });
    await run(
      [
        item(1, {
          parts: [
            {
              text: "x",
              quoted_drop_id: null,
              media: [
                { url: `${CDN}/broken.png`, mime_type: "image/png" },
                { url: `${CDN}/huge.mp4`, mime_type: "video/mp4" },
              ],
              attachments: [],
            },
          ],
        }),
      ],
      value
    );
    expect(sent[0]!.files).toEqual([]);
    expect(sent[0]!.imported.mediaNotImported).toBe(2);
  });

  it("counts media too large to encrypt apart from other misses", async () => {
    const limit = largestMovableBytes();
    const { value, sent } = deps({
      media: (url) =>
        ({
          size: url.endsWith("edge.png") ? limit : limit + 1,
          type: "image/png",
        }) as Blob,
    });
    const result = await run(
      [
        item(1, {
          parts: [
            {
              text: "x",
              quoted_drop_id: null,
              media: [
                { url: `${CDN}/edge.png`, mime_type: "image/png" },
                { url: `${CDN}/over.png`, mime_type: "image/png" },
              ],
              attachments: [],
            },
          ],
        }),
      ],
      value
    );
    expect(sent[0]!.files.map((file) => file.name)).toEqual(["edge.png"]);
    expect(result).toMatchObject({
      mediaMoved: 1,
      mediaTooLarge: 1,
      mediaNotMoved: 0,
    });
    expect(sent[0]!.imported.mediaNotImported).toBe(1);
  });

  it("pauses when the upload quota is used up, then resumes later", async () => {
    let quota = true;
    const { value, sent } = deps({
      failOn: (input) =>
        quota && input.imported.dropId === "drop-2"
          ? Object.assign(new Error("rate"), { code: "E2EE_RATE_LIMITED" })
          : null,
    });
    const first = await run([item(1), item(2), item(3)], value);
    expect(first).toMatchObject({ outcome: "paused", pause: "rate", sent: 1 });
    quota = false;
    const second = await run([item(1), item(2), item(3)], value);
    expect(second).toMatchObject({ outcome: "done", sent: 2, skipped: 1 });
    expect(sent.map((s) => s.imported.dropId)).toEqual([
      "drop-1",
      "drop-2",
      "drop-3",
    ]);
  });

  it("pauses, without dropping media, when the blob store refuses an upload", async () => {
    const withImage = item(1, {
      parts: [
        {
          text: "hi",
          quoted_drop_id: null,
          media: [{ url: `${CDN}/a.png`, mime_type: "image/png" }],
          attachments: [],
        },
      ],
    });
    // The real shape: blob API errors reach sendImported's caller unchanged.
    const rate = new E2eeApiError({
      message: "rate",
      status: 429,
      code: "E2EE_RATE_LIMITED",
    });
    const full = new E2eeApiError({
      message: "full",
      status: 413,
      code: "E2EE_TOO_LARGE",
    });
    for (const [error, pause] of [
      [rate, "rate"],
      [full, "storage"],
    ] as const) {
      const { value, sent } = deps({
        failOn: (input) => (input.files.length > 0 ? error : null),
      });
      const result = await run([withImage], value);
      expect(result).toMatchObject({ outcome: "paused", pause, sent: 0 });
      expect(sent).toEqual([]);
    }
  });

  it("moves text only when asked to skip media after the storage filled", async () => {
    const { value, sent } = deps();
    const result = await runLegacyDmImport({
      g: "g1",
      waveId: "wave-1",
      items: [
        item(1, {
          parts: [
            {
              text: "hi",
              quoted_drop_id: null,
              media: [{ url: `${CDN}/a.png`, mime_type: "image/png" }],
              attachments: [],
            },
          ],
        }),
      ],
      deps: value,
      signal: new AbortController().signal,
      skipMedia: true,
    });
    expect(value.fetchMedia).not.toHaveBeenCalled();
    expect(sent[0]!.files).toEqual([]);
    expect(result).toMatchObject({ outcome: "done", mediaNotMoved: 1 });
  });

  it("still sends the text when the attachments are refused otherwise", async () => {
    const { value, sent } = deps({
      failOn: (input) =>
        input.files.length > 0
          ? new E2eeApiError({
              message: "nope",
              status: 400,
              code: "E2EE_BAD_SIGNATURE",
            })
          : null,
    });
    const result = await run(
      [
        item(1, {
          parts: [
            {
              text: "hi",
              quoted_drop_id: null,
              media: [{ url: `${CDN}/a.png`, mime_type: "image/png" }],
              attachments: [],
            },
          ],
        }),
      ],
      value
    );
    expect(result).toMatchObject({
      sent: 1,
      failed: 0,
      mediaMoved: 0,
      mediaNotMoved: 1,
    });
    expect(sent[0]!.files).toEqual([]);
    expect(sent[0]!.imported.mediaNotImported).toBe(1);
    // The refusal is logged by code only, never with text or file names.
    expect(warn).toHaveBeenCalledWith(
      "Legacy DM import: send refused",
      "E2EE_BAD_SIGNATURE",
      "retrying without attachments"
    );
  });

  it("counts other failures and carries on", async () => {
    const { value } = deps({
      failOn: (input) =>
        input.imported.dropId === "drop-1" ? new Error("boom") : null,
    });
    const result = await run([item(1), item(2)], value);
    expect(result).toMatchObject({ outcome: "done", sent: 1, failed: 1 });
  });

  it("carries more than 10 images on follow-up messages of the same part", async () => {
    const media = Array.from({ length: 12 }, (_, i) => ({
      url: `${CDN}/img-${i}.png`,
      mime_type: "image/png",
    }));
    const { value, sent } = deps();
    const result = await run(
      [
        item(1, {
          parts: [
            { text: "album", quoted_drop_id: null, media, attachments: [] },
          ],
        }),
      ],
      value
    );
    expect(sent.map((s) => [s.imported.part, s.text, s.files.length])).toEqual([
      [0, "album", 10],
      [1, "", 2],
    ]);
    expect(result).toMatchObject({ sent: 2, mediaMoved: 12, mediaNotMoved: 0 });
  });

  it("stops when cancelled", async () => {
    const controller = new AbortController();
    const { value, sent } = deps();
    (value.sleep as jest.Mock).mockImplementation(async () =>
      controller.abort()
    );
    const result = await run(
      [item(1), item(2), item(3)],
      value,
      controller.signal
    );
    expect(result.outcome).toBe("cancelled");
    expect(sent).toHaveLength(1);
  });
});
