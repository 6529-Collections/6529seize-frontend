import {
  assertWithin,
  byteAt,
  type ContainerDescription,
  type FormatStripper,
  joinBytes,
  latin1,
  StripUnsupported,
  u16,
} from "./container";

/**
 * GIF: image data, colour tables, graphic control and looping blocks are
 * kept; comments, XMP and other application extensions are dropped.
 */

const IMAGE_DESCRIPTOR = 0x2c;
const EXTENSION = 0x21;
const TRAILER = 0x3b;
const GRAPHIC_CONTROL = 0xf9;
const PLAIN_TEXT = 0x01;
const APPLICATION = 0xff;
const COMMENT = 0xfe;

/** Looping control, plus the GIF colour profile extension. */
const RENDER_APPLICATIONS: ReadonlySet<string> = new Set([
  "NETSCAPE2.0",
  "ANIMEXTS1.0",
  "ICCRGBG1012",
]);

interface GifBlock {
  readonly start: number;
  readonly end: number;
  /** Null when the block renders; otherwise the label of what it carries. */
  readonly dropLabel: string | null;
}

const colorTableBytes = (packed: number): number =>
  packed & 0x80 ? 3 * 2 ** ((packed & 0x07) + 1) : 0;

/** Skips data sub-blocks up to and including the zero-length terminator. */
function skipSubBlocks(input: Uint8Array, from: number): number {
  let position = from;
  for (;;) {
    const size = byteAt(input, position);
    position += 1 + size;
    if (size === 0) {
      return position;
    }
    assertWithin(input, position, "GIF sub-block");
  }
}

function extensionDropLabel(input: Uint8Array, start: number): string | null {
  const label = byteAt(input, start + 1);
  if (label === GRAPHIC_CONTROL || label === PLAIN_TEXT) {
    return null;
  }
  if (label === COMMENT) {
    return "comment";
  }
  if (label === APPLICATION) {
    // 0x21 0xFF, then an 11-byte block: 8-byte identifier and 3-byte code.
    const identifier =
      start + 14 <= input.length && input[start + 2] === 11
        ? latin1(input, start + 3, start + 14)
        : "";
    return RENDER_APPLICATIONS.has(identifier)
      ? null
      : `application:${identifier.trim() || "unknown"}`;
  }
  return `extension:${label.toString(16)}`;
}

function walkGif(input: Uint8Array): {
  blocks: GifBlock[];
  trailingBytes: number;
} {
  const signature = latin1(input, 0, 6);
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new StripUnsupported("Not a GIF");
  }
  const headerEnd = 13 + colorTableBytes(byteAt(input, 10));
  assertWithin(input, headerEnd, "GIF colour table");
  const blocks: GifBlock[] = [{ start: 0, end: headerEnd, dropLabel: null }];
  let position = headerEnd;
  // A file that ends cleanly between blocks without a trailer still decodes.
  while (position < input.length) {
    const introducer = byteAt(input, position);
    if (introducer === TRAILER) {
      return { blocks, trailingBytes: input.length - position - 1 };
    }
    let end: number;
    let dropLabel: string | null = null;
    if (introducer === IMAGE_DESCRIPTOR) {
      const dataStart =
        position + 10 + colorTableBytes(byteAt(input, position + 9)) + 1;
      assertWithin(input, dataStart, "GIF local colour table");
      end = skipSubBlocks(input, dataStart);
    } else if (introducer === EXTENSION) {
      end = skipSubBlocks(input, position + 2);
      dropLabel = extensionDropLabel(input, position);
    } else {
      throw new StripUnsupported("Unknown GIF block");
    }
    blocks.push({ start: position, end, dropLabel });
    position = end;
  }
  return { blocks, trailingBytes: 0 };
}

function strip(input: Uint8Array): Uint8Array {
  const { blocks } = walkGif(input);
  return joinBytes([
    ...blocks
      .filter((block) => block.dropLabel === null)
      .map((block) => input.subarray(block.start, block.end)),
    Uint8Array.of(TRAILER),
  ]);
}

function describe(input: Uint8Array): ContainerDescription {
  const { blocks, trailingBytes } = walkGif(input);
  const render: Uint8Array[] = [];
  const metadataBlocks: string[] = [];
  for (const block of blocks) {
    if (block.dropLabel === null) {
      render.push(input.subarray(block.start, block.end));
    } else {
      metadataBlocks.push(block.dropLabel);
    }
  }
  if (trailingBytes > 0) {
    metadataBlocks.push("trailing-data");
  }
  return {
    width: u16(input, 6, true),
    height: u16(input, 8, true),
    orientation: 1,
    render,
    metadataBlocks,
  };
}

export const gifStripper: FormatStripper = { strip, describe };
