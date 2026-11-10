import {
  getDownloadFileDecision,
  prepareBlobForDownload,
} from "@/helpers/download-file-type.helpers";

const bytes = (value: string | readonly number[]) =>
  typeof value === "string"
    ? new TextEncoder().encode(value)
    : new Uint8Array(value);

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0];

describe("getDownloadFileDecision", () => {
  it.each([
    ["photo.png", bytes(PNG), "photo.png", "image/png"],
    ["photo", bytes([0xff, 0xd8, 0xff, 0xe0]), "photo.jpg", "image/jpeg"],
    ["clip.mov", bytes("\0\0\0\u0014ftypqt  "), "clip.mov", "video/quicktime"],
    ["clip", bytes("\0\0\0\u0018ftypisom"), "clip.mp4", "video/mp4"],
    ["paper.pdf", bytes("%PDF-1.7"), "paper.pdf", "application/pdf"],
    ["model.glb", bytes("glTF\u0002"), "model.glb", "model/gltf-binary"],
    ["song", bytes("ID3\u0004"), "song.mp3", "audio/mpeg"],
    ["still", bytes("RIFF\0\0\0\0WEBPVP8 "), "still.webp", "image/webp"],
  ])(
    "keeps a served format the bytes confirm: %s",
    (fileName, leading, expectedName, expectedType) => {
      expect(
        getDownloadFileDecision({
          fileName,
          leadingBytes: leading,
        })
      ).toEqual({ fileName: expectedName, type: expectedType });
    }
  );

  it("renames content to the format its bytes show", () => {
    expect(
      getDownloadFileDecision({
        fileName: "art.webp",
        declaredTypes: ["image/webp"],
        leadingBytes: Uint8Array.from(PNG),
      })
    ).toEqual({ fileName: "art.png", type: "image/png" });
  });

  const OPAQUE = "application/octet-stream";

  it.each([
    ["x.html", "text/html", "<!doctype html><script>", "x.bin"],
    ["x.svg", "image/svg+xml", "<svg xmlns=", "x.bin"],
    ["run.js", "text/javascript", "alert(1)", "run.bin"],
    ["setup.exe", "application/x-msdownload", "MZ", "setup.bin"],
    ["x.pdf.exe", "application/pdf", "MZ", "x.pdf.bin"],
    ["no-extension", "", "data", "no-extension.bin"],
    ["unknown.qqq", "", "data", "unknown.bin"],
  ])(
    "saves %s (%s) as an opaque .bin file",
    (fileName, declaredType, content, expected) => {
      expect(
        getDownloadFileDecision({
          fileName,
          declaredTypes: [declaredType],
          leadingBytes: bytes(content),
        })
      ).toEqual({ fileName: expected, type: OPAQUE });
    }
  );

  it.each([
    ["report.docx", "application/vnd.openxmlformats-officedocument"],
    ["photos.zip", "application/zip"],
    ["data.csv", "text/csv"],
    ["notes.html.txt", "text/plain"],
    ["a.txt", "text/html"],
    ["fake.png", "image/png"],
  ])(
    "keeps the name of %s but never lets the browser render it",
    (fileName, declaredType) => {
      expect(
        getDownloadFileDecision({
          fileName,
          declaredTypes: [declaredType],
          leadingBytes: bytes("<html><script>alert(1)</script>"),
        })
      ).toEqual({ fileName, type: OPAQUE });
    }
  );

  it("decides by name when no bytes are available", () => {
    expect(
      getDownloadFileDecision({
        fileName: "photo.jpeg",
        declaredTypes: ["image"],
      })
    ).toEqual({ fileName: "photo.jpeg", type: OPAQUE });
    expect(getDownloadFileDecision({ fileName: "report.docx" })).toEqual({
      fileName: "report.docx",
      type: OPAQUE,
    });
    expect(
      getDownloadFileDecision({
        fileName: "animation.html",
        declaredTypes: ["video/mp4"],
      })
    ).toEqual({ fileName: "animation.bin", type: OPAQUE });
  });

  it("names a file without an extension after a declared media type", () => {
    expect(
      getDownloadFileDecision({
        fileName: "video",
        declaredTypes: ["video/mp4"],
      })
    ).toEqual({ fileName: "video.mp4", type: OPAQUE });
    expect(
      getDownloadFileDecision({
        fileName: "page",
        declaredTypes: ["text/html"],
      })
    ).toEqual({ fileName: "page.bin", type: OPAQUE });
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
    expect(
      getDownloadFileDecision({ fileName, declaredTypes: ["image/png"] })
        .fileName
    ).toBe(expected);
  });

  it("shortens long names but keeps the extension", () => {
    const { fileName } = getDownloadFileDecision({
      fileName: `${"a".repeat(300)}.png`,
      leadingBytes: Uint8Array.from(PNG),
    });
    expect(fileName).toBe(`${"a".repeat(100)}.png`);
  });
});

describe("prepareBlobForDownload", () => {
  it("re-types fetched HTML as an opaque file", async () => {
    const result = await prepareBlobForDownload({
      blob: new Blob(["<html><script></script></html>"], { type: "text/html" }),
      fileName: "page.html",
    });
    expect(result.fileName).toBe("page.bin");
    expect(result.blob.type).toBe("application/octet-stream");
  });

  it("keeps a PNG blob as it is", async () => {
    const blob = new Blob([Uint8Array.from(PNG)], { type: "image/png" });
    const result = await prepareBlobForDownload({ blob, fileName: "a.png" });
    expect(result).toEqual({ blob, fileName: "a.png" });
  });
});
