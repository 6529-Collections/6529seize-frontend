import { renderHook, act } from "@testing-library/react";
import useFileUploader from "@/components/waves/memes/file-upload/hooks/useFileUploader";
import { validateFile } from "@/components/waves/memes/file-upload/utils/fileValidation";

const actualValidation = jest.requireActual<
  typeof import("@/components/waves/memes/file-upload/utils/fileValidation")
>("@/components/waves/memes/file-upload/utils/fileValidation");
const validateFileMock = jest.mocked(validateFile);

jest.mock("@/components/waves/memes/file-upload/utils/fileValidation", () => ({
  validateFile: jest.fn(() => ({ valid: true })),
  testVideoCompatibility: jest.fn(() =>
    Promise.resolve({ canPlay: true, tested: true })
  ),
}));

const createUrl = jest.fn(() => "blob:url");
const revokeUrl = jest.fn();

Object.defineProperty(global, "URL", {
  value: { createObjectURL: createUrl, revokeObjectURL: revokeUrl },
});

describe("useFileUploader", () => {
  const file = new File(["a"], "a.png", { type: "image/png" });

  beforeEach(() => {
    jest.clearAllMocks();
    createUrl.mockReset().mockReturnValue("blob:url");
    validateFileMock.mockReset().mockResolvedValue({ valid: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("processes valid file", async () => {
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const { result } = renderHook(() =>
      useFileUploader({ onFileSelect, setUploaded })
    );
    await act(async () => {
      result.current.processFile(file);
    });
    expect(result.current.state.objectUrl).toBe("blob:url");
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("resets state and revokes url on remove", async () => {
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const { result } = renderHook(() =>
      useFileUploader({ onFileSelect, setUploaded })
    );
    await act(async () => {
      result.current.processFile(file);
    });
    act(() => {
      result.current.handleRemoveFile({
        stopPropagation() {},
        preventDefault() {},
      } as any);
    });
    expect(revokeUrl).toHaveBeenCalled();
    expect(setUploaded).toHaveBeenCalledWith(false);
    expect(result.current.state.objectUrl).toBeNull();
  });

  it("shows error toast on invalid file", async () => {
    const {
      validateFile,
    } = require("@/components/waves/memes/file-upload/utils/fileValidation");
    validateFile.mockReturnValueOnce({ valid: false, error: "nope" });
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const showToast = jest.fn();
    const { result } = renderHook(() =>
      useFileUploader({ onFileSelect, setUploaded, showToast })
    );
    await act(async () => {
      result.current.processFile(file);
    });
    expect(result.current.state.error).toBe("nope");
    expect(showToast).toHaveBeenCalledWith(
      expect.objectContaining({ message: "nope" })
    );
  });

  it("retries processing when handleRetry called", async () => {
    jest.useFakeTimers();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    createUrl.mockImplementationOnce(() => {
      throw new Error("Preview unavailable");
    });
    const onFileSelect = jest.fn();
    const setUploaded = jest.fn();
    const { result } = renderHook(() =>
      useFileUploader({ onFileSelect, setUploaded })
    );
    await act(async () => {
      result.current.processFile(file);
    });
    expect(result.current.state.error).toBe("Preview unavailable");
    expect(result.current.state.hasRecoveryOption).toBe(true);
    await act(async () => {
      result.current.handleRetry();
    });
    expect(validateFile).toHaveBeenCalledTimes(2);
    expect(result.current.state.objectUrl).toBe("blob:url");
    jest.clearAllTimers();
  });

  it.each([
    {
      name: "oversized.png",
      type: "image/png",
      size: 250_000_001,
      error: "File size exceeds 250 MB limit.",
    },
    {
      name: "unsupported.txt",
      type: "text/plain",
      size: 1,
      error: "File type not supported.",
    },
    {
      name: "invalid.glb",
      type: "model/gltf-binary",
      size: 1,
      error: "Invalid GLB file.",
    },
    {
      name: "model.gltf",
      type: "model/gltf+json",
      size: 1,
      error: "File type not supported.",
    },
  ])(
    "rejects $name without retry and accepts a replacement",
    async ({ name, type, size, error }) => {
      validateFileMock.mockImplementation(actualValidation.validateFile);
      const invalidFile = new File(["a"], name, { type });
      Object.defineProperty(invalidFile, "size", { value: size });
      const onFileSelect = jest.fn();
      const { result } = renderHook(() =>
        useFileUploader({ onFileSelect, setUploaded: jest.fn() })
      );

      await act(async () => {
        await result.current.processFile(invalidFile);
      });
      expect(result.current.state.error).toContain(error);
      expect(result.current.state.visualState).toBe("invalid");
      expect(result.current.state.hasRecoveryOption).toBe(false);
      expect(result.current.state.processingFile).toBeNull();
      expect(onFileSelect).not.toHaveBeenCalled();
      expect(createUrl).not.toHaveBeenCalled();

      await act(async () => {
        result.current.handleRetry();
      });
      expect(validateFileMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.processFile(file);
      });
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.objectUrl).toBe("blob:url");
      expect(onFileSelect).toHaveBeenCalledWith(file);
    }
  );
});
