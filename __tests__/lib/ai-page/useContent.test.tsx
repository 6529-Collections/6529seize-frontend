/** @jest-environment node */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";

import AiUsePage from "@/components/ai-page/use/AiUsePage";
import {
  AI_USE_INTRO,
  AI_USE_SECTIONS,
  type AiUseBlock,
} from "@/lib/ai-page/content/use";
import { AI_USE_IMAGES } from "@/lib/ai-page/content/useImages";

function allBlocks(blocks: readonly AiUseBlock[]): AiUseBlock[] {
  return blocks.flatMap((block) =>
    block.kind === "steps"
      ? [block, ...block.items.flatMap((item) => allBlocks(item.blocks ?? []))]
      : [block]
  );
}

const BLOCKS = [
  ...allBlocks(AI_USE_INTRO),
  ...AI_USE_SECTIONS.flatMap((section) => allBlocks(section.blocks)),
];

function texts(): string[] {
  return BLOCKS.flatMap((block) => {
    switch (block.kind) {
      case "p":
        return [block.text];
      case "steps":
        return block.items.map((item) => item.text);
      case "list":
        return [...block.items];
      case "table":
        return [...block.head, ...block.rows.flat()];
      default:
        return [];
    }
  });
}

/** A WebP file's width and height, from its VP8X, VP8L or VP8 header. */
function webpSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(file);
  const chunk = bytes.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  }
  if (chunk === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  return {
    width: bytes.readUInt16LE(26) & 0x3fff,
    height: bytes.readUInt16LE(28) & 0x3fff,
  };
}

describe("the /ai/use walk-through", () => {
  it("has a picture file of the listed size for every picture", () => {
    for (const image of Object.values(AI_USE_IMAGES)) {
      const file = path.join(process.cwd(), "public", image.src);
      expect(existsSync(file)).toBe(true);
      expect(webpSize(file)).toEqual({
        width: image.width,
        height: image.height,
      });
    }
  });

  it("gives every picture its alt text, and uses every picture it lists", () => {
    const used = new Set<string>();
    for (const block of BLOCKS) {
      if (block.kind === "image") {
        expect(block.alt.length).toBeGreaterThan(10);
        used.add(block.image);
      }
    }
    expect([...used].sort()).toEqual(Object.keys(AI_USE_IMAGES).sort());
  });

  it("links only to sections that exist", () => {
    const ids = new Set([
      ...AI_USE_SECTIONS.map((section) => section.id),
      ...BLOCKS.flatMap((block) => (block.kind === "h3" ? [block.id] : [])),
    ]);
    expect(ids.size).toBe(
      AI_USE_SECTIONS.length +
        BLOCKS.filter((block) => block.kind === "h3").length
    );
    for (const text of texts()) {
      for (const [, anchor] of text.matchAll(/\]\(#([^)]+)\)/g)) {
        expect(ids).toContain(anchor);
      }
    }
  });

  it("leaves the network out, and keeps the Windows workaround", () => {
    // "the computer's network disk" is about a disk, not the 6529 AI network.
    expect(texts().join(" ")).not.toMatch(/AI network|the network\b|\bTor\b/i);
    const known = AI_USE_SECTIONS.find(
      (section) => section.id === "known-problems"
    );
    expect(JSON.stringify(known)).toContain(
      "Invoke-WebRequest https://valid-isrgrootx2.letsencrypt.org -UseBasicParsing | Out-Null"
    );
  });

  it("puts the contents first, and the sections in order", () => {
    const html = renderToStaticMarkup(<AiUsePage />);
    expect(html).toContain("On this page");
    let last = -1;
    for (const section of AI_USE_SECTIONS) {
      const at = html.indexOf(`id="${section.id}"`);
      expect(at).toBeGreaterThan(last);
      last = at;
      expect(html).toContain(`href="#${section.id}"`);
    }
    // The pictures are the dark ones, as the site is dark.
    expect(html).not.toMatch(/-light\.(png|webp)/);
  });
});
