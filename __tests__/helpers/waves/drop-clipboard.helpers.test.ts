import { buildDropClipboardText } from "@/helpers/waves/drop-clipboard.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";

const createDrop = (overrides: Record<string, unknown> = {}): any => ({
  id: "d1",
  serial_no: 5,
  drop_type: ApiDropType.Chat,
  author: { handle: "alice" },
  created_at: 1735689600000,
  wave: { id: "w1", name: "Test Wave" },
  parts: [
    {
      part_id: 1,
      content: "gm",
      quoted_drop: null,
      media: [],
    },
  ],
  metadata: [],
  reply_to: null,
  ...overrides,
});

describe("buildDropClipboardText", () => {
  it("formats a plain-text message with author heading and content", () => {
    const text = buildDropClipboardText(createDrop(), "en-US");

    expect(text).toMatch(/^alice \(.+\): gm$/);
  });

  it("formats the heading timestamp using the provided locale", () => {
    const drop = createDrop();
    const timeFor = (locale: string) =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(drop.created_at));

    expect(buildDropClipboardText(drop, "en-US")).toContain(
      `alice (${timeFor("en-US")}):`
    );
    expect(buildDropClipboardText(drop, "de-DE")).toContain(
      `alice (${timeFor("de-DE")}):`
    );
  });

  it("omits the time suffix for invalid timestamps", () => {
    const text = buildDropClipboardText(
      createDrop({ created_at: Number.NaN }),
      "en-US"
    );

    expect(text).toBe("alice: gm");
  });

  it("strips markdown markup in plain format and keeps it in markdown format", () => {
    const drop = createDrop({
      parts: [
        {
          part_id: 1,
          content: "hello **bold** [site](https://example.com)",
          quoted_drop: null,
          media: [],
        },
      ],
    });

    const plain = buildDropClipboardText(drop, "en-US");
    expect(plain).toContain("hello bold site (https://example.com)");
    expect(plain).not.toContain("**");

    const markdown = buildDropClipboardText(drop, "en-US", "markdown");
    expect(markdown).toContain("hello **bold** [site](https://example.com)");
  });

  it("includes reply context from the drop itself", () => {
    const drop = createDrop({
      reply_to: {
        drop_id: "d0",
        drop_part_id: 1,
        is_deleted: false,
        drop: {
          author: { handle: "bob" },
          parts: [{ part_id: 1, content: "original message" }],
          created_at: 1735689500000,
        },
      },
    });

    const text = buildDropClipboardText(drop, "en-US");

    expect(text).toContain("Replying to bob");
    expect(text).toContain("original message");
  });

  it("includes quoted drop content", () => {
    const drop = createDrop({
      parts: [
        {
          part_id: 1,
          content: "check this out",
          quoted_drop: {
            drop_id: "d2",
            drop_part_id: 1,
            drop: {
              author: { handle: "carol" },
              parts: [{ part_id: 1, content: "quoted words" }],
              created_at: 1735689400000,
            },
          },
          media: [],
        },
      ],
    });

    const text = buildDropClipboardText(drop, "en-US");

    expect(text).toContain("check this out");
    expect(text).toContain("Quote from carol");
    expect(text).toContain("quoted words");
  });

  it("appends deduplicated attachment urls", () => {
    const drop = createDrop({
      parts: [
        {
          part_id: 1,
          content: "media drop",
          quoted_drop: null,
          media: [
            { url: "https://media.example/a.png" },
            { url: "https://media.example/a.png" },
            { url: "https://media.example/b.png" },
          ],
        },
      ],
    });

    const text = buildDropClipboardText(drop, "en-US");

    expect(text).toContain("https://media.example/a.png");
    expect(text).toContain("https://media.example/b.png");
    expect(text.match(/a\.png/g)).toHaveLength(1);
  });

  it("annotates non-chat drops with their type", () => {
    const drop = createDrop({
      drop_type: ApiDropType.Winner,
      winning_context: { place: 2 },
    });

    const text = buildDropClipboardText(drop, "en-US");

    expect(text).toContain("Type: WINNER");
    expect(text).toContain("Rank: 2");
  });
});
