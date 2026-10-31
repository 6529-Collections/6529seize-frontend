import type { LegacyDmItem } from "@/components/e2ee/legacy/legacyDmExport";
import {
  chunkText,
  IMPORT_TEXT_CHUNK,
  planLegacyImport,
  runLegacyDmImport,
  type LegacyImportDeps,
} from "@/components/e2ee/legacy/legacyDmImport";
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

describe("planLegacyImport", () => {
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

  it("pauses when the upload quota is used up, then resumes later", async () => {
    let quota = true;
    const { value, sent } = deps({
      failOn: (input) =>
        quota && input.imported.dropId === "drop-2"
          ? Object.assign(new Error("rate"), { code: "E2EE_RATE_LIMITED" })
          : null,
    });
    const first = await run([item(1), item(2), item(3)], value);
    expect(first).toMatchObject({ outcome: "paused", sent: 1 });
    quota = false;
    const second = await run([item(1), item(2), item(3)], value);
    expect(second).toMatchObject({ outcome: "done", sent: 2, skipped: 1 });
    expect(sent.map((s) => s.imported.dropId)).toEqual([
      "drop-1",
      "drop-2",
      "drop-3",
    ]);
  });

  it("still sends the text when the attachments are refused", async () => {
    const { value, sent } = deps({
      failOn: (input) =>
        input.files.length > 0
          ? Object.assign(new Error("full"), { code: "E2EE_TOO_LARGE" })
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
  });

  it("counts other failures and carries on", async () => {
    const { value } = deps({
      failOn: (input) =>
        input.imported.dropId === "drop-1" ? new Error("boom") : null,
    });
    const result = await run([item(1), item(2)], value);
    expect(result).toMatchObject({ outcome: "done", sent: 1, failed: 1 });
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
