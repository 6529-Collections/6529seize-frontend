import {
  getDownloadFileDecision,
  prepareBlobForDownload,
} from "@/helpers/download-file-type.helpers";

const OPAQUE = "application/octet-stream";

const bytes = (value: string | readonly number[]) =>
  typeof value === "string"
    ? Uint8Array.from(Array.from(value, (char) => char.codePointAt(0) ?? 0))
    : Uint8Array.from(value);

/** An ISO base media `ftyp` box with a major and compatible brands. */
const ftyp = (major: string, ...compatible: string[]) => {
  const body = `ftyp${major}\0\0\0\0${compatible.join("")}`;
  const size = body.length + 4;
  return bytes([0, 0, 0, size, ...bytes(body)]);
};

const PNG = bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0]);
const HTML = bytes("<!doctype html><script>alert(1)</script>");
// MPEG-1 Layer III, 128 kbit/s, 44.1 kHz.
const MP3_FRAME = bytes([0xff, 0xfb, 0x90, 0x64]);
const ID3_TAG = bytes("ID3\u0004\0\0\0\0\0\0");
const UTF16_LE_TEXT = bytes([0xff, 0xfe, 0x61, 0x00, 0x2c, 0x00, 0x62, 0x00]);
const UTF16_BE_TEXT = bytes([0xfe, 0xff, 0x00, 0x61, 0x00, 0x2c, 0x00, 0x62]);

const decide = (
  fileName: string,
  leadingBytes?: Uint8Array,
  declaredTypes?: string[]
) => getDownloadFileDecision({ fileName, leadingBytes, declaredTypes });

describe("getDownloadFileDecision", () => {
  describe("ISO base media brands", () => {
    it.each([
      ["heic", ftyp("heic", "mif1", "heic"), "image/heic", "heic"],
      ["heix", ftyp("heix", "mif1"), "image/heic", "heic"],
      ["hevc", ftyp("hevc"), "image/heic", "heic"],
      ["mif1 + heic", ftyp("mif1", "heic"), "image/heic", "heic"],
      ["mif1 + avif", ftyp("mif1", "avif"), "image/avif", "avif"],
      ["msf1", ftyp("msf1"), "image/heif", "heif"],
      ["avif", ftyp("avif", "mif1"), "image/avif", "avif"],
      ["M4A", ftyp("M4A ", "isom"), "audio/mp4", "m4a"],
      ["M4B", ftyp("M4B "), "audio/mp4", "m4a"],
      ["3gp5", ftyp("3gp5", "isom"), "video/3gpp", "3gp"],
      ["3g2a", ftyp("3g2a"), "video/3gpp2", "3g2"],
      ["qt", ftyp("qt  "), "video/quicktime", "mov"],
      ["isom", ftyp("isom", "iso2", "avc1"), "video/mp4", "mp4"],
      ["mp42", ftyp("mp42"), "video/mp4", "mp4"],
      ["dash", ftyp("dash"), "video/mp4", "mp4"],
      ["unknown + isom", ftyp("abcd", "isom"), "video/mp4", "mp4"],
    ])(
      "names a file without an extension after the %s brand",
      (_brand, leading, type, extension) => {
        expect(decide("media", leading)).toEqual({
          fileName: `media.${extension}`,
          type,
        });
      }
    );

    it("keeps an iPhone photo named .HEIC as a HEIC image", () => {
      expect(decide("IMG_0001.HEIC", ftyp("heic", "mif1", "heic"))).toEqual({
        fileName: "IMG_0001.heic",
        type: "image/heic",
      });
    });

    it("does not guess an unrecognised brand", () => {
      expect(decide("clip.m4v", ftyp("zzzz"))).toEqual({
        fileName: "clip.m4v",
        type: OPAQUE,
      });
      expect(decide("clip", ftyp("zzzz"))).toEqual({
        fileName: "clip.bin",
        type: OPAQUE,
      });
    });
  });

  describe("audio frames and text byte-order marks", () => {
    it("recognises an MPEG audio frame header and an ID3 tag", () => {
      expect(decide("song", MP3_FRAME)).toEqual({
        fileName: "song.mp3",
        type: "audio/mpeg",
      });
      expect(decide("song", ID3_TAG)).toEqual({
        fileName: "song.mp3",
        type: "audio/mpeg",
      });
    });

    it("rejects frame syncs with reserved or invalid header fields", () => {
      // Reserved version, free bitrate, bad bitrate, reserved sample rate.
      for (const header of [
        [0xff, 0xeb, 0x90],
        [0xff, 0xfb, 0x00],
        [0xff, 0xfb, 0xf0],
        [0xff, 0xfb, 0x9c],
      ]) {
        expect(decide("song", bytes(header)).fileName).toBe("song.bin");
      }
    });

    it.each([
      ["little-endian", UTF16_LE_TEXT],
      ["big-endian", UTF16_BE_TEXT],
    ])("never treats %s UTF-16 text as audio", (_order, leading) => {
      expect(decide("table.csv", leading)).toEqual({
        fileName: "table.csv",
        type: OPAQUE,
      });
      expect(decide("notes.txt", leading)).toEqual({
        fileName: "notes.txt",
        type: OPAQUE,
      });
      expect(decide("unnamed", leading).fileName).toBe("unnamed.bin");
    });
  });

  describe("name and bytes", () => {
    it("uses the media type when the bytes confirm the extension", () => {
      expect(decide("photo.png", PNG)).toEqual({
        fileName: "photo.png",
        type: "image/png",
      });
      expect(decide("photo.jpeg", JPEG)).toEqual({
        fileName: "photo.jpeg",
        type: "image/jpeg",
      });
      expect(decide("paper.pdf", bytes("%PDF-1.7"))).toEqual({
        fileName: "paper.pdf",
        type: "application/pdf",
      });
    });

    it("keeps an allowlisted extension the bytes disagree with, as an opaque file", () => {
      expect(decide("art.webp", PNG, ["image/webp"])).toEqual({
        fileName: "art.webp",
        type: OPAQUE,
      });
      expect(decide("voice.m4a", MP3_FRAME)).toEqual({
        fileName: "voice.m4a",
        type: OPAQUE,
      });
    });

    it("upgrades a missing or unknown extension to the format the bytes show", () => {
      expect(decide("photo", JPEG)).toEqual({
        fileName: "photo.jpg",
        type: "image/jpeg",
      });
      expect(decide("unknown.qqq", PNG)).toEqual({
        fileName: "unknown.png",
        type: "image/png",
      });
    });

    it.each([
      ["x.html", "text/html", HTML, "x.bin"],
      ["x.svg", "image/svg+xml", bytes("<svg xmlns="), "x.bin"],
      ["run.js", "text/javascript", bytes("alert(1)"), "run.bin"],
      ["setup.exe", "application/x-msdownload", bytes("MZ"), "setup.bin"],
      ["x.pdf.exe", "application/pdf", bytes("%PDF-1.7"), "x.pdf.bin"],
      ["looks.png", "image/png", PNG, "looks.png"],
      ["fake.png", "image/png", HTML, "fake.bin"],
      ["drawing.jpg", "image/jpeg", bytes("  <svg xmlns="), "drawing.bin"],
      [
        "page.pdf",
        "application/pdf",
        bytes([0xef, 0xbb, 0xbf, ...bytes("<html>")]),
        "page.bin",
      ],
      ["no-extension", "", bytes("data"), "no-extension.bin"],
      ["unknown.qqq", "", bytes("data"), "unknown.bin"],
    ])(
      "saves %s (%s) as expected",
      (fileName, declaredType, leading, expected) => {
        const decision = decide(fileName, leading, [declaredType]);
        expect(decision.fileName).toBe(expected);
        if (expected.endsWith(".bin")) {
          expect(decision.type).toBe(OPAQUE);
        }
      }
    );

    it.each([
      ["report.docx", "application/vnd.openxmlformats-officedocument"],
      ["photos.zip", "application/zip"],
      ["data.csv", "text/csv"],
      ["notes.html.txt", "text/plain"],
      ["a.txt", "text/html"],
    ])(
      "keeps the name of %s but never lets the browser render it",
      (fileName, declaredType) => {
        expect(
          decide(fileName, bytes("PK\u0003\u0004 plain"), [declaredType])
        ).toEqual({ fileName, type: OPAQUE });
      }
    );

    it("keeps a plain-text name even when the text is markup", () => {
      expect(decide("snippet.txt", HTML)).toEqual({
        fileName: "snippet.txt",
        type: OPAQUE,
      });
    });
  });

  describe("without bytes", () => {
    it("decides by name", () => {
      expect(decide("photo.jpeg", undefined, ["image"])).toEqual({
        fileName: "photo.jpeg",
        type: OPAQUE,
      });
      expect(decide("report.docx")).toEqual({
        fileName: "report.docx",
        type: OPAQUE,
      });
      expect(decide("animation.html", undefined, ["video/mp4"])).toEqual({
        fileName: "animation.bin",
        type: OPAQUE,
      });
    });

    it("names a file without an extension after a declared media type", () => {
      expect(decide("video", undefined, ["video/mp4"])).toEqual({
        fileName: "video.mp4",
        type: OPAQUE,
      });
      expect(decide("page", undefined, ["text/html"])).toEqual({
        fileName: "page.bin",
        type: OPAQUE,
      });
    });
  });

  it.each([
    ["../../etc/passwd.png", "_.._etc_passwd.png"],
    ["C:\\Users\\me\\photo.png", "C__Users_me_photo.png"],
    ["re\u202Egnp.exe", "regnp.bin"],
    ["line\nbreak\u0000.png", "linebreak.png"],
    [".hidden.png", "hidden.png"],
    ["...", "download.png"],
    ["trailing. . .png", "trailing.png"],
    ["CON.png", "_CON.png"],
    ["lpt1.tar.png", "_lpt1.tar.png"],
    ["", "download.png"],
  ])("makes %j a safe file name", (fileName, expected) => {
    expect(decide(fileName, undefined, ["image/png"]).fileName).toBe(expected);
  });

  it("shortens long names but keeps the extension", () => {
    expect(decide(`${"a".repeat(300)}.png`, PNG).fileName).toBe(
      `${"a".repeat(100)}.png`
    );
  });
});

describe("prepareBlobForDownload", () => {
  it("re-types fetched HTML as an opaque file", async () => {
    const result = await prepareBlobForDownload({
      blob: new Blob(["<html><script></script></html>"], { type: "text/html" }),
      fileName: "page.html",
    });
    expect(result.fileName).toBe("page.bin");
    expect(result.blob.type).toBe(OPAQUE);
  });

  it("keeps a PNG blob as it is", async () => {
    const blob = new Blob([PNG], { type: "image/png" });
    const result = await prepareBlobForDownload({ blob, fileName: "a.png" });
    expect(result).toEqual({ blob, fileName: "a.png" });
  });
});
