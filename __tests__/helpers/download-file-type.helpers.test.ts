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

  it.each([
    ["page.html", "text/html", "<!doctype html><script>"],
    ["logo.svg", "image/svg+xml", "<svg xmlns="],
    ["run.js", "text/javascript", "alert(1)"],
    ["setup.exe", "application/x-msdownload", "MZ\u0090\0"],
    ["fake.png", "image/png", "<html><body>"],
  ])("saves %s (%s) as an opaque file", (fileName, declaredType, content) => {
    expect(
      getDownloadFileDecision({
        fileName,
        declaredTypes: [declaredType],
        leadingBytes: bytes(content),
      })
    ).toEqual({
      fileName: `${fileName.split(".")[0]}.bin`,
      type: "application/octet-stream",
    });
  });

  it("keeps plain text and CSV, which have no signature, as text", () => {
    expect(
      getDownloadFileDecision({
        fileName: "notes.txt",
        declaredTypes: ["text/plain; charset=utf-8"],
        leadingBytes: bytes("hello"),
      })
    ).toEqual({ fileName: "notes.txt", type: "text/plain" });
    expect(
      getDownloadFileDecision({
        fileName: "data.csv",
        declaredTypes: ["application/octet-stream"],
        leadingBytes: bytes("a,b\n1,2"),
      })
    ).toEqual({ fileName: "data.csv", type: "text/csv" });
  });

  it("uses the declared type, then the extension, when no bytes are available", () => {
    expect(
      getDownloadFileDecision({
        fileName: "video",
        declaredTypes: ["video/mp4"],
      })
    ).toEqual({ fileName: "video.mp4", type: "video/mp4" });
    expect(
      getDownloadFileDecision({
        fileName: "photo.jpeg",
        declaredTypes: ["image"],
      })
    ).toEqual({ fileName: "photo.jpg", type: "image/jpeg" });
    expect(getDownloadFileDecision({ fileName: "animation.html" })).toEqual({
      fileName: "animation.bin",
      type: "application/octet-stream",
    });
  });

  it.each([
    ["../../etc/passwd.png", "_.._etc_passwd.png"],
    ["C:\\Users\\me\\photo.png", "C__Users_me_photo.png"],
    ["re\u202Egnp.exe", "regnp.png"],
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
