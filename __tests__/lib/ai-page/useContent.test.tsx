/** @jest-environment node */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { renderToStaticMarkup } from "react-dom/server";

import AiUsePage from "@/components/ai-page/use/AiUsePage";
import {
  AI_FIXED_BUGS,
  AI_KNOWN_BUGS,
} from "@/lib/ai-page/content/knownIssues";
import {
  AI_USE_FOOTNOTE,
  AI_USE_INTRO,
  AI_USE_LEAD,
  AI_USE_SECTIONS,
  type AiUseBlock,
} from "@/lib/ai-page/content/use";
import { AI_USE_IMAGES } from "@/lib/ai-page/content/useImages";
import { AI_SCREENSHOTS } from "@/lib/ai-page/screenshots";

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
      case "note":
        return [block.text];
      case "steps":
        return block.items.map((item) => item.text);
      case "list":
        return [...block.items];
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
  it("has each picture's file at its listed size, and crops inside it", () => {
    for (const image of Object.values(AI_USE_IMAGES)) {
      const file = path.join(process.cwd(), "public", image.src);
      expect(existsSync(file)).toBe(true);
      expect(webpSize(file)).toEqual({
        width: image.width,
        height: image.height,
      });
      if (image.crop) {
        expect(image.crop.x + image.crop.width).toBeLessThanOrEqual(
          image.width
        );
        expect(image.crop.y + image.crop.height).toBeLessThanOrEqual(
          image.height
        );
      }
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
    // A phone's own capture, which stands in for a step's picture there.
    for (const image of Object.values(AI_USE_IMAGES)) {
      if ("phone" in image && "image" in image.phone) {
        used.add(image.phone.image);
      }
    }
    for (const slot of Object.values(AI_SCREENSHOTS)) {
      used.add(slot.image);
      if ("phone" in slot) {
        used.add(slot.phone);
      }
    }
    expect([...used].sort()).toEqual(Object.keys(AI_USE_IMAGES).sort());
  });

  it("numbers each section it points to as the page does", () => {
    for (const text of texts()) {
      for (const [, number, id] of text.matchAll(
        /\[section (\d+)\]\(#([^)]+)\)/g
      )) {
        const index = AI_USE_SECTIONS.findIndex((section) => section.id === id);
        expect(index + 1).toBe(Number(number));
      }
    }
    expect(texts().join(" ")).not.toMatch(/\(section \d+\)/);
  });

  it("links only to sections and pages that exist", () => {
    const ids = new Set([
      ...AI_USE_SECTIONS.map((section) => section.id),
      ...BLOCKS.flatMap((block) => (block.kind === "h3" ? [block.id] : [])),
    ]);
    for (const text of texts()) {
      for (const [, anchor] of text.matchAll(/\]\(#([^)]+)\)/g)) {
        expect(ids).toContain(anchor);
      }
    }
  });

  it("leaves the network, the install and the known problems to their pages", () => {
    const all = texts().join(" ");
    // "the computer's network disk" is about a disk, not the 6529 AI network.
    expect(all).not.toMatch(/AI network|the network\b|\bTor\b/i);
    const ids = AI_USE_SECTIONS.map((section) => section.id);
    expect(ids).not.toContain("download-and-install");
    expect(ids).not.toContain("known-problems");
    expect(all).toContain("[Guide](/ai/guide)");
    expect(all).not.toMatch(
      /we went no further|only such tool we ran|openai 3\.52/
    );
  });

  it("names no release, so it holds for the newest one", () => {
    const text = JSON.stringify([
      AI_USE_LEAD,
      AI_USE_INTRO,
      AI_USE_SECTIONS,
      AI_USE_FOOTNOTE,
    ]);
    expect(text).not.toMatch(/0\.1\.0|rc\.1|release candidate/i);
  });

  it("leaves out the bugs the newest release fixed", () => {
    expect(JSON.stringify(AI_KNOWN_BUGS)).not.toMatch(
      /Fetch and serve|sign-in|chat title|Vulkan/i
    );
    expect(AI_FIXED_BUGS.join(" ")).toContain("Fetch and serve");
    expect(JSON.stringify(AI_USE_SECTIONS)).not.toContain("7 days");
  });

  it("puts the contents first, and the sections in order", () => {
    const html = renderToStaticMarkup(<AiUsePage version="0.1.0-rc.1" />);
    expect(html).toContain("On this page");
    let last = -1;
    for (const section of AI_USE_SECTIONS) {
      const at = html.indexOf(`id="${section.id}"`);
      expect(at).toBeGreaterThan(last);
      last = at;
      expect(html).toContain(`href="#${section.id}"`);
    }
    expect(html).toContain("Known issues</a> lists the bugs we know");
    // Long output folds behind a summary that says how long it is.
    expect(html).toMatch(/Show output \(\d+ lines\)/);
    // The pictures are the dark ones, as the site is dark.
    expect(html).not.toMatch(/-light\.(png|webp)/);
  });

  it("prints the newest release's version in what the commands print", () => {
    const html = renderToStaticMarkup(<AiUsePage version="0.1.0-rc.2" />);
    expect(html).toContain("6529-ai 0.1.0-rc.2, local mode");
    // Debian writes a pre-release with a tilde.
    expect(html).toContain("Removing 6529-ai-cuda (0.1.0~rc.2) ...");
    expect(html).not.toMatch(/&lt;(deb-)?version&gt;/);
  });

  it("cuts no line of a chat on a phone, and frames every capture of the app", () => {
    expect(AI_USE_IMAGES["40-chat"].phone).toEqual({
      image: "98-phone-chat-answer",
    });
    expect(AI_USE_IMAGES["41-chat-follow-up"].phone).toEqual({ hidden: true });
    const html = renderToStaticMarkup(<AiUsePage version="0.1.0-rc.2" />);
    // Each zoom button holds the window's title bar.
    const buttons =
      html.match(/aria-label="See the whole picture: [^"]*"/g) ?? [];
    expect(buttons.length).toBeGreaterThan(20);
    const bars = html.match(/>6529 AI<\/span>/g) ?? [];
    expect(bars).toHaveLength(buttons.length);
  });
});
