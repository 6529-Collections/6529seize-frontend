/**
 * @jest-environment node
 */
import { crc32 } from "node:zlib";
import {
  neutralImageName,
  stripImageMetadata,
} from "@/lib/e2ee/image-metadata";
import { readTiffOrientation } from "@/lib/e2ee/image-metadata/exif";

const ascii = (value: string): Uint8Array =>
  Uint8Array.from(value, (char) => char.codePointAt(0) ?? 0);

const join = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const u16be = (value: number) => Uint8Array.of(value >> 8, value & 0xff);
const u32be = (value: number) =>
  Uint8Array.of(
    value >>> 24,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff
  );
const u32le = (value: number) => u32be(value).reverse();

/** Index of `needle` in `haystack`, or -1. */
function indexOf(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}

const contains = (haystack: Uint8Array, needle: Uint8Array) =>
  indexOf(haystack, needle) >= 0;

/**
 * Big-endian TIFF: IFD0 with Orientation, Make ("Phone") and a GPS IFD
 * pointer; the GPS IFD holds GPSLatitudeRef "N".
 */
function tiffWithGps(orientation: number): Uint8Array {
  const entry = (tag: number, type: number, count: number, value: Uint8Array) =>
    join(u16be(tag), u16be(type), u32be(count), value);
  const ifd0 = join(
    u16be(3),
    entry(0x010f, 2, 6, u32be(50)), // Make -> offset 50
    entry(0x0112, 3, 1, join(u16be(orientation), u16be(0))),
    entry(0x8825, 4, 1, u32be(56)), // GPSInfo -> offset 56
    u32be(0)
  );
  const header = join(ascii("MM"), u16be(42), u32be(8));
  const make = ascii("Phone\0"); // 50..56
  const gpsIfd = join(
    u16be(1),
    entry(0x0001, 2, 2, join(ascii("N\0"), u16be(0))),
    u32be(0)
  );
  return join(header, ifd0, make, gpsIfd);
}

/** The GPSInfo IFD pointer entry (tag 0x8825, LONG) in a big-endian TIFF. */
const GPS_TAG = join(u16be(0x8825), u16be(4));

// ---- JPEG ---------------------------------------------------------------

const seg = (marker: number, payload: Uint8Array) =>
  join(Uint8Array.of(0xff, marker), u16be(payload.length + 2), payload);

const ICC = ascii("ICC_PROFILE\0\x01\x01fake-icc-profile-bytes");
const JPEG_TABLES = join(
  seg(0xdb, Uint8Array.of(0, ...new Array<number>(64).fill(1))), // DQT
  seg(0xc0, Uint8Array.of(8, 0, 20, 0, 30, 1, 1, 0x11, 0)), // SOF0 30x20
  seg(0xc4, Uint8Array.of(0, ...new Array<number>(16).fill(0))) // DHT
);
/** Scan header plus entropy data with a stuffed 0xFF00 and a restart marker. */
const JPEG_SCAN = join(
  seg(0xda, Uint8Array.of(1, 1, 0, 0, 63, 0)),
  Uint8Array.of(0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56)
);

function jpeg(options: { orientation?: number; extras?: boolean } = {}) {
  const extras = options.extras ?? true;
  return join(
    Uint8Array.of(0xff, 0xd8),
    seg(0xe0, join(ascii("JFIF\0"), Uint8Array.of(1, 2, 0, 0, 1, 0, 1, 0, 0))),
    extras
      ? seg(
          0xe1,
          join(ascii("Exif\0\0"), tiffWithGps(options.orientation ?? 6))
        )
      : new Uint8Array(0),
    extras
      ? seg(
          0xe1,
          ascii("http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>Owner</x:xmpmeta>")
        )
      : new Uint8Array(0),
    seg(0xe2, ICC),
    extras ? seg(0xed, ascii("Photoshop 3.0\0IPTC")) : new Uint8Array(0),
    extras ? seg(0xfe, ascii("taken at home")) : new Uint8Array(0),
    JPEG_TABLES,
    JPEG_SCAN,
    Uint8Array.of(0xff, 0xd9),
    extras ? ascii("trailing thumbnail") : new Uint8Array(0)
  );
}

function jpegOrientation(bytes: Uint8Array): number {
  const at = indexOf(bytes, ascii("Exif\0\0"));
  if (at < 0) {
    return 1;
  }
  const length = ((bytes[at - 2] ?? 0) << 8) | (bytes[at - 1] ?? 0);
  return readTiffOrientation(bytes.subarray(at + 6, at - 2 + length));
}

// ---- PNG ----------------------------------------------------------------

const PNG_SIGNATURE = Uint8Array.of(
  0x89,
  0x50,
  0x4e,
  0x47,
  0x0d,
  0x0a,
  0x1a,
  0x0a
);

function chunk(type: string, data: Uint8Array): Uint8Array {
  const body = join(ascii(type), data);
  return join(u32be(data.length), body, u32be(crc32(body) >>> 0));
}

const PNG_IHDR = chunk(
  "IHDR",
  join(u32be(30), u32be(20), Uint8Array.of(8, 6, 0, 0, 0))
);
const PNG_ICCP = chunk("iCCP", ascii("profile\0\0compressed-icc"));
const PNG_IDAT = chunk("IDAT", Uint8Array.of(0x78, 0x9c, 1, 2, 3, 4));
const PNG_IEND = chunk("IEND", new Uint8Array(0));

function png(orientation = 8) {
  return join(
    PNG_SIGNATURE,
    PNG_IHDR,
    PNG_ICCP,
    chunk("tEXt", ascii("Author\0Jane Doe")),
    chunk("eXIf", tiffWithGps(orientation)),
    chunk("tIME", Uint8Array.of(7, 230, 1, 2, 3, 4, 5)),
    PNG_IDAT,
    PNG_IEND
  );
}

function pngOrientation(bytes: Uint8Array): number {
  const at = indexOf(bytes, ascii("eXIf"));
  if (at < 0) {
    return 1;
  }
  const length = new DataView(bytes.buffer, bytes.byteOffset).getUint32(at - 4);
  const data = bytes.subarray(at + 4, at + 4 + length);
  const crc = new DataView(bytes.buffer, bytes.byteOffset).getUint32(
    at + 4 + length
  );
  expect(crc).toBe(crc32(bytes.subarray(at, at + 4 + length)) >>> 0);
  return readTiffOrientation(data);
}

// ---- WebP ---------------------------------------------------------------

const riffChunk = (fourcc: string, data: Uint8Array) =>
  join(
    ascii(fourcc),
    u32le(data.length),
    data,
    new Uint8Array(data.length % 2)
  );

const WEBP_ICCP = riffChunk("ICCP", ascii("fake-icc"));
const WEBP_VP8L = riffChunk(
  "VP8L",
  Uint8Array.of(0x2f, 29, 0x40, 0x04, 0x00, 9, 9, 9)
);

function webp(orientation = 3) {
  const flags = 0x20 | 0x08 | 0x04; // ICC, EXIF, XMP
  const vp8x = riffChunk(
    "VP8X",
    Uint8Array.of(flags, 0, 0, 0, 29, 0, 0, 19, 0, 0)
  );
  const body = join(
    ascii("WEBP"),
    vp8x,
    WEBP_ICCP,
    WEBP_VP8L,
    riffChunk("EXIF", tiffWithGps(orientation)),
    riffChunk("XMP ", ascii("<x:xmpmeta>Owner</x:xmpmeta>"))
  );
  return join(ascii("RIFF"), u32le(body.length), body);
}

function webpInfo(bytes: Uint8Array) {
  const vp8x = indexOf(bytes, ascii("VP8X"));
  const exif = indexOf(bytes, ascii("EXIF"));
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  return {
    flags: bytes[vp8x + 8] ?? 0,
    orientation:
      exif < 0
        ? 1
        : readTiffOrientation(
            bytes.subarray(exif + 8, exif + 8 + view.getUint32(exif + 4, true))
          ),
    riffSizeOk: view.getUint32(4, true) === bytes.length - 8,
  };
}

// ---- GIF ----------------------------------------------------------------

function gif() {
  return join(
    ascii("GIF89a"),
    Uint8Array.of(2, 0, 1, 0, 0x80, 0, 0), // 2x1, global colour table of 2
    Uint8Array.of(0, 0, 0, 255, 255, 255),
    Uint8Array.of(0x21, 0xff, 11),
    ascii("NETSCAPE2.0"),
    Uint8Array.of(3, 1, 0, 0, 0),
    Uint8Array.of(0x21, 0xfe, 9),
    ascii("Jane Doe!"),
    Uint8Array.of(0),
    Uint8Array.of(0x21, 0xff, 11),
    ascii("XMP DataXMP"),
    Uint8Array.of(5),
    ascii("Owner"),
    Uint8Array.of(0),
    Uint8Array.of(0x2c, 0, 0, 0, 0, 2, 0, 1, 0, 0),
    Uint8Array.of(2, 2, 0x44, 0x01, 0),
    Uint8Array.of(0x3b)
  );
}

// ---- tests --------------------------------------------------------------

describe("stripImageMetadata", () => {
  const cases: {
    name: string;
    input: Uint8Array;
    gone: (string | Uint8Array)[];
    kept: Uint8Array[];
    orientation: (bytes: Uint8Array) => number;
    expectedOrientation: number;
  }[] = [
    {
      name: "JPEG with EXIF GPS, XMP, IPTC, a comment, ICC and trailing data",
      input: jpeg(),
      gone: [GPS_TAG, "Phone", "Owner", "IPTC", "taken at home", "trailing"],
      kept: [ICC, JPEG_TABLES, JPEG_SCAN],
      orientation: jpegOrientation,
      expectedOrientation: 6,
    },
    {
      name: "PNG with tEXt, tIME, eXIf and iCCP",
      input: png(),
      gone: [GPS_TAG, "Jane Doe", "Phone", "tIME", "tEXt"],
      kept: [PNG_IHDR, PNG_ICCP, PNG_IDAT, PNG_IEND],
      orientation: pngOrientation,
      expectedOrientation: 8,
    },
    {
      name: "WebP with EXIF, XMP and ICCP",
      input: webp(),
      gone: [GPS_TAG, "Owner", "Phone", "XMP "],
      kept: [WEBP_ICCP, WEBP_VP8L],
      orientation: (bytes: Uint8Array) => webpInfo(bytes).orientation,
      expectedOrientation: 3,
    },
    {
      name: "GIF with a comment and an XMP application block",
      input: gif(),
      gone: ["Jane Doe", "XMP Data", "Owner"],
      kept: [ascii("NETSCAPE2.0"), Uint8Array.of(2, 2, 0x44, 0x01, 0)],
      orientation: () => 1,
      expectedOrientation: 1,
    },
  ];

  it.each(cases)(
    "$name: metadata gone, colour and image data kept, orientation preserved",
    ({ input, gone, kept, orientation, expectedOrientation }) => {
      expect(orientation(input)).toBe(expectedOrientation);
      const output = stripImageMetadata(input);
      expect(output).not.toBe(input);
      for (const item of gone) {
        const bytes = typeof item === "string" ? ascii(item) : item;
        expect(contains(input, bytes)).toBe(true);
        expect(contains(output, bytes)).toBe(false);
      }
      for (const bytes of kept) {
        expect(contains(output, bytes)).toBe(true);
      }
      expect(orientation(output)).toBe(expectedOrientation);
      // Idempotent: a cleaned image has nothing more to remove.
      expect(stripImageMetadata(output)).toBe(output);
    }
  );

  it("keeps an upright image upright without writing an EXIF block", () => {
    const output = stripImageMetadata(jpeg({ orientation: 1 }));
    expect(contains(output, ascii("Exif"))).toBe(false);
    expect(jpegOrientation(output)).toBe(1);
  });

  it("updates the WebP header flags and RIFF size", () => {
    const output = stripImageMetadata(webp());
    const info = webpInfo(output);
    expect(info.flags & 0x04).toBe(0); // XMP gone
    expect(info.flags & 0x08).toBe(0x08); // orientation EXIF kept
    expect(info.flags & 0x20).toBe(0x20); // ICC kept
    expect(info.riffSizeOk).toBe(true);
  });

  it("drops the WebP EXIF flag when the image is upright", () => {
    const output = stripImageMetadata(webp(1));
    expect(webpInfo(output).flags & 0x08).toBe(0);
    expect(contains(output, ascii("EXIF"))).toBe(false);
  });

  it("returns an image without metadata unchanged", () => {
    const clean = jpeg({ extras: false });
    expect(stripImageMetadata(clean)).toBe(clean);
  });

  const unchanged: [string, Uint8Array][] = [
    ["a truncated JPEG", jpeg().subarray(0, 120)],
    [
      "a JPEG without a frame header",
      join(
        Uint8Array.of(0xff, 0xd8),
        seg(0xfe, ascii("note")),
        JPEG_SCAN,
        Uint8Array.of(0xff, 0xd9)
      ),
    ],
    ["a truncated PNG", png().subarray(0, 60)],
    [
      "a PNG with an unknown critical chunk",
      join(
        PNG_SIGNATURE,
        PNG_IHDR,
        chunk("tEXt", ascii("a\0b")),
        chunk("ABCD", ascii("x")),
        PNG_IDAT,
        PNG_IEND
      ),
    ],
    ["a truncated WebP", webp().subarray(0, 40)],
    ["a truncated GIF", gif().subarray(0, 30)],
    ["HEIC", join(u32be(24), ascii("ftypheic"), new Uint8Array(32))],
    ["random bytes", Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)],
    ["an empty file", new Uint8Array(0)],
  ];

  it.each(unchanged)("returns %s unchanged without throwing", (_, input) => {
    expect(stripImageMetadata(input)).toBe(input);
  });
});

describe("neutralImageName", () => {
  it.each([
    ["image/jpeg", "image.jpg"],
    ["image/PNG", "image.png"],
    ["image/webp", "image.webp"],
    ["image/heic", "image.heic"],
    ["image/x-unknown", "image"],
    ["application/pdf", null],
    ["video/mp4", null],
    ["", null],
  ])("%s -> %s", (mime, expected) => {
    expect(neutralImageName(mime)).toBe(expected);
  });
});
