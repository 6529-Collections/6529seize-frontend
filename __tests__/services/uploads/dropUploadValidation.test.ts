import { filterValidDropUploadFiles } from "@/services/uploads/dropUploadValidation";
import {
  DROP_UPLOAD_ACCEPT,
  getAcceptedUploadFormats,
  getContentType,
  isSupportedUploadFile,
} from "@/services/uploads/mediaUploadMimeType";

const file = (name: string, type = "") => new File(["content"], name, { type });

describe("drop upload validation", () => {
  it.each([
    "image/avif",
    "",
    "application/octet-stream",
    "binary/octet-stream",
  ])("accepts uppercase AVIF with browser type %s", (type) => {
    const image = file("photo.AVIF", type);
    expect(isSupportedUploadFile(image)).toBe(true);
    expect(getContentType(image)).toBe("image/avif");
  });

  it.each([
    "heic",
    "heif",
    "svg",
    "bmp",
    "tiff",
    "jxl",
    "webm",
    "mkv",
    "m4v",
    "3gp",
    "m4a",
    "flac",
    "opus",
    "aiff",
    "gltf",
    "usdz",
    "docx",
    "xlsx",
    "txt",
  ])("rejects .%s without a broad category promise", (extension) => {
    const unsupported = file(`upload.${extension}`);
    const setToast = jest.fn();
    expect(filterValidDropUploadFiles([unsupported], setToast)).toEqual([]);
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: `Unsupported file: upload.${extension}`,
        description: getAcceptedUploadFormats(),
        autoClose: false,
      })
    );
    expect(setToast.mock.calls[0][0].description).not.toMatch(
      /Supported formats: Image/
    );
  });

  it("keeps valid files in a mixed batch", () => {
    const png = file("photo.png", "image/png");
    const pdf = file("report.pdf", "application/pdf");
    const setToast = jest.fn();
    expect(
      filterValidDropUploadFiles(
        [png, file("drawing.svg", "image/svg+xml"), pdf],
        setToast
      )
    ).toEqual([png, pdf]);
    expect(setToast).toHaveBeenCalledTimes(1);
  });

  it("rejects conflicting AVIF MIME and extensions", () => {
    expect(isSupportedUploadFile(file("photo.jpg", "image/avif"))).toBe(false);
    expect(isSupportedUploadFile(file("photo.avif", "image/png"))).toBe(false);
    expect(isSupportedUploadFile(file("photo.jpg", "image/heic"))).toBe(false);
  });

  it.each([
    ["movie.mp4", "video/webm"],
    ["song.mp3", "audio/flac"],
    ["movie.mp4", "audio/mpeg"],
    ["song.mp3", "video/mp4"],
  ])("rejects a misleading filename %s with MIME %s", (name, type) => {
    expect(isSupportedUploadFile(file(name, type))).toBe(false);
  });

  it.each([
    ["photo.jpg", "image/pjpeg", "image/jpeg"],
    ["photo.png", "image/x-png", "image/png"],
    ["song.wav", "audio/x-wav", "audio/wav"],
    ["song.wav", "audio/wave", "audio/wav"],
    ["song.wav", "audio/x-pn-wav", "audio/wav"],
    ["song.mp3", "audio/x-mp3", "audio/mp3"],
    ["song.mp3", "audio/x-mpeg", "audio/mpeg"],
    ["movie.avi", "video/avi", "video/x-msvideo"],
    ["movie.avi", "video/msvideo", "video/x-msvideo"],
  ])("preserves the browser alias %s / %s", (name, type, expectedType) => {
    const upload = file(name, type);
    expect(isSupportedUploadFile(upload)).toBe(true);
    expect(getContentType(upload)).toBe(expectedType);
  });

  it("reports an extensionless image immediately, matching API filename requirements", () => {
    const setToast = jest.fn();
    expect(
      filterValidDropUploadFiles([file("photo", "image/png")], setToast)
    ).toEqual([]);
    expect(setToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Unsupported file: photo" })
    );
  });

  it("advertises exact picker formats including AVIF and GLB", () => {
    expect(DROP_UPLOAD_ACCEPT).toContain(".avif");
    expect(DROP_UPLOAD_ACCEPT).toContain(".glb");
    expect(DROP_UPLOAD_ACCEPT).not.toContain("*");
  });

  it("preserves media and attachment size limits while keeping other files", () => {
    const png = file("photo.png");
    const tooLarge = file("large.avif");
    Object.defineProperty(tooLarge, "size", { value: 500 * 1024 * 1024 + 1 });
    const pdf = file("large.pdf");
    Object.defineProperty(pdf, "size", { value: 25 * 1024 * 1024 + 1 });
    expect(filterValidDropUploadFiles([png, tooLarge, pdf], jest.fn())).toEqual(
      [png]
    );
  });
});
