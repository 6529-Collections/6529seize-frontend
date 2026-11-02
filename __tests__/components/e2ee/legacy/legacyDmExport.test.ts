import {
  buildLegacyDmExport,
  escapeHtml,
  fetchLegacyDmDrops,
  LEGACY_DM_EXPORT_FORMAT,
  legacyDmExportFileName,
  participantsOf,
  renderLegacyDmHtml,
  toLegacyDmItem,
} from "@/components/e2ee/legacy/legacyDmExport";
import {
  formatLegacyDmDeletionDate,
  isLegacyDmClosed,
  LEGACY_DM_DELETION_AT,
} from "@/components/e2ee/legacy/legacyDmRetention";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";

function drop(serial: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `drop-${serial}`,
    serial_no: serial,
    author: {
      id: serial % 2 ? "alice-id" : "bob-id",
      handle: serial % 2 ? "alice" : "bob",
    },
    created_at: 1_700_000_000_000 + serial,
    updated_at: null,
    title: null,
    reply_to: undefined,
    parts: [
      {
        part_id: 1,
        content: `hello ${serial}`,
        media: [],
        attachments: [],
        quoted_drop: null,
      },
    ],
    mentioned_users: [],
    reactions: [],
    ...overrides,
  } as unknown as ApiDropWithoutWave;
}

describe("legacy DM retention date", () => {
  it("is 2026-12-01T00:00Z, shown as a UTC day in the viewer's locale", () => {
    expect(LEGACY_DM_DELETION_AT).toBe("2026-12-01T00:00:00.000Z");
    expect(formatLegacyDmDeletionDate("en-US")).toBe("Dec 1, 2026");
    expect(formatLegacyDmDeletionDate("en-GB")).toBe("1 Dec 2026");
    expect(isLegacyDmClosed(Date.parse(LEGACY_DM_DELETION_AT) - 1)).toBe(false);
    expect(isLegacyDmClosed(Date.parse(LEGACY_DM_DELETION_AT))).toBe(true);
  });
});

describe("legacy DM export", () => {
  it("maps a drop to an item with author, times, parts, mentions and reactions", () => {
    const item = toLegacyDmItem(
      drop(3, {
        updated_at: 5,
        reply_to: { drop_id: "drop-1", drop_part_id: 1, is_deleted: false },
        parts: [
          {
            part_id: 1,
            content: null,
            media: [
              { url: "https://cdn.example/a.png", mime_type: "image/png" },
            ],
            attachments: [
              {
                attachment_id: "a1",
                file_name: "f.pdf",
                mime_type: "application/pdf",
                kind: "PDF",
                status: "READY",
                url: "https://cdn.example/f.pdf",
              },
            ],
            quoted_drop: { drop_id: "drop-0", drop_part_id: 1 },
          },
        ],
        mentioned_users: [
          {
            mentioned_profile_id: "bob-id",
            handle_in_content: "bobby",
            current_handle: "bob",
          },
        ],
        reactions: [{ reaction: ":fire:", profiles: [{ id: "bob-id" }] }],
      })
    );
    expect(item).toEqual({
      legacy_drop_id: "drop-3",
      serial_no: 3,
      author: { profile_id: "alice-id", handle: "alice" },
      created_at: 1_700_000_000_003,
      updated_at: 5,
      title: null,
      reply_to: "drop-1",
      parts: [
        {
          text: "",
          quoted_drop_id: "drop-0",
          media: [{ url: "https://cdn.example/a.png", mime_type: "image/png" }],
          attachments: [
            {
              file_name: "f.pdf",
              mime_type: "application/pdf",
              url: "https://cdn.example/f.pdf",
            },
          ],
        },
      ],
      mentions: [{ profile_id: "bob-id", handle: "bob" }],
      reactions: [{ reaction: ":fire:", profile_ids: ["bob-id"] }],
    });
  });

  it("builds a sorted, deduplicated export with its notice", () => {
    const data = buildLegacyDmExport({
      waveId: "wave-1",
      name: "alice, bob",
      participants: participantsOf([drop(2), drop(1)]),
      exportedBy: { profile_id: "alice-id", handle: "alice" },
      exportedAt: new Date("2026-11-02T10:00:00Z"),
      notice: "notice",
      drops: [drop(2), drop(1), drop(2)],
    });
    expect(data.format).toBe(LEGACY_DM_EXPORT_FORMAT);
    expect(data.server_deletion_at).toBe(LEGACY_DM_DELETION_AT);
    expect(data.messages.map((m) => m.serial_no)).toEqual([1, 2]);
    expect(data.conversation.participants.map((p) => p.handle)).toEqual([
      "alice",
      "bob",
    ]);
  });

  it("pages through the feed, newest first, until it runs dry", async () => {
    const pages: Record<string, ApiDropWithoutWave[]> = {
      start: [drop(5), drop(4)],
      "4": [drop(3), drop(2)],
      "2": [drop(1)],
      "1": [],
    };
    const fetchPage = jest.fn(
      async (_wave: string, before: number | null) =>
        ({
          drops: pages[before === null ? "start" : String(before)] ?? [],
        }) as unknown as ApiWaveDropsFeed
    );
    const progress: number[] = [];
    const drops = await fetchLegacyDmDrops({
      waveId: "wave-1",
      fetchPage,
      onProgress: (count) => progress.push(count),
    });
    expect(drops.map((d) => d.serial_no)).toEqual([5, 4, 3, 2, 1]);
    expect(progress).toEqual([2, 4, 5]);
    expect(fetchPage).toHaveBeenLastCalledWith("wave-1", 1, undefined);
  });

  it("escapes everything in the HTML page and links only http(s)", () => {
    const data = buildLegacyDmExport({
      waveId: "w",
      name: "<b>x</b>",
      participants: [{ profile_id: "p", handle: "<i>h</i>" }],
      exportedBy: { profile_id: "p", handle: "h" },
      exportedAt: new Date(0),
      notice: "<script>alert(1)</script>",
      drops: [
        drop(1, {
          parts: [
            {
              part_id: 1,
              content: '<img src=x onerror="alert(1)">',
              media: [
                { url: "javascript:alert(1)", mime_type: "image/png" },
                {
                  url: "https://cdn.example/a.png?x=1&y=2",
                  mime_type: "image/png",
                },
              ],
              attachments: [],
              quoted_drop: null,
            },
          ],
        }),
      ],
    });
    const html = renderLegacyDmHtml(data, {
      lang: "en-US",
      title: "<title>",
      exportedAt: "Exported",
      participants: "People",
      replyTo: "reply",
      edited: "edited",
      media: "Files",
      unknownAuthor: "Unknown",
      formatTime: () => "time",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain('href="https://cdn.example/a.png?x=1&amp;y=2"');
    expect(html).toContain("default-src 'none'");
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("names files safely", () => {
    const at = new Date("2026-11-02T10:00:00Z");
    expect(legacyDmExportFileName("Alice, Bob & co", at, "json")).toBe(
      "6529-dm-alice-bob-co-2026-11-02.json"
    );
    expect(legacyDmExportFileName("💬", at, "html")).toBe(
      "6529-dm-conversation-2026-11-02.html"
    );
  });
});
