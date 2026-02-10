import { validateFile, testVideoCompatibility } from "@/components/waves/memes/file-upload/utils/fileValidation";

// Mock MediaError constants
const MediaErrorMock = {
  MEDIA_ERR_ABORTED: 1,
  MEDIA_ERR_NETWORK: 2,
  MEDIA_ERR_DECODE: 3,
  MEDIA_ERR_SRC_NOT_SUPPORTED: 4,
};

// Define MediaError globally for tests
(global as any).MediaError = MediaErrorMock;

// helper to create File
function makeFile(name: string, type: string, size = 10) {
  const file = new File(["a"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateFile", () => {
  it("rejects missing file", () => {
    const res = validateFile(undefined as any);
    expect(res.valid).toBe(false);
  });

  it("rejects wrong type", () => {
    const res = validateFile(makeFile("a.txt", "text/plain"));
    expect(res.valid).toBe(false);
  });

  it("rejects large file", () => {
    const res = validateFile(makeFile("a.png", "image/png", 201 * 1024 * 1024));
    expect(res.valid).toBe(false);
  });

  it("accepts good image", () => {
    const res = validateFile(makeFile("a.png", "image/png"));
    expect(res.valid).toBe(true);
  });
});

describe("testVideoCompatibility", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global as any).URL.createObjectURL = jest.fn(() => "blob:video");
    (global as any).URL.revokeObjectURL = jest.fn();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns early when not a video", async () => {
    const res = await testVideoCompatibility(makeFile("a.png", "image/png"));
    expect(res).toEqual({ canPlay: true, tested: false });
  });

  it("reports unsupported mime", async () => {
    const video: any = {
      canPlayType: jest.fn(() => ""),
      load: jest.fn(),
      removeAttribute: jest.fn(),
    };
    jest.spyOn(document, "createElement").mockReturnValue(video);
    const promise = testVideoCompatibility(makeFile("a.mkv", "video/mkv"));
    await Promise.resolve();
    video.onerror && video.onerror();
    jest.runAllTimers();
    const result = await promise;
    expect(result.tested).toBe(true);
    expect(result.canPlay).toBe(false);
  });

  it("resolves on metadata", async () => {
    const video: any = {
      canPlayType: jest.fn(() => "maybe"),
      load: jest.fn(),
      removeAttribute: jest.fn(),
      videoWidth: 1,
      videoHeight: 1,
    };
    jest.spyOn(document, "createElement").mockReturnValue(video);
    const promise = testVideoCompatibility(makeFile("a.mp4", "video/mp4"));
    video.onloadedmetadata && video.onloadedmetadata(new Event("load"));
    jest.runAllTimers();
    const result = await promise;
    expect(result.canPlay).toBe(true);
    expect(result.tested).toBe(true);
  });

  it("handles video error codes", async () => {
    const error: Partial<MediaError> = { code: MediaError.MEDIA_ERR_DECODE };
    const video: any = {
      canPlayType: jest.fn(() => "maybe"),
      load: jest.fn(),
      removeAttribute: jest.fn(),
      error,
    };
    jest.spyOn(document, "createElement").mockReturnValue(video);
    const promise = testVideoCompatibility(makeFile("a.mp4", "video/mp4"));
    video.onerror();
    jest.runAllTimers();
    const result = await promise;
    expect(result.canPlay).toBe(false);
    expect(result.tested).toBe(true);
    expect(result.technicalReason).toMatch(/decoded/);
  });

  it("catches exceptions during setup", async () => {
    jest.spyOn(document, "createElement").mockImplementation(() => {
      throw new Error("fail");
    });
    const result = await testVideoCompatibility(makeFile("v.mp4", "video/mp4"));
    expect(result.canPlay).toBe(false);
    expect(result.tested).toBe(true);
    expect(result.technicalReason).toBe("fail");
  });
});
