import { act, renderHook } from "@testing-library/react";
import { useMediaUpload } from "@/components/waves/memes/submission/hooks/useMediaUpload";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import { MediaUploadRefusedError } from "@/services/uploads/MediaUploadRefusedError";

jest.mock("@/components/waves/create-wave/services/multiPartUpload", () => ({
  multiPartUpload: jest.fn(),
}));

describe("useMediaUpload", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeAll(() => {
    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("uploads a submission's supporting media as a decision entry", async () => {
    jest.mocked(multiPartUpload).mockResolvedValue({
      url: "https://cdn.example/process.jpg",
      mime_type: "image/jpeg",
    });
    const file = new File(["jpeg"], "process.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useMediaUpload(4));

    await act(async () => {
      await result.current.addFiles([file]);
    });

    expect(multiPartUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        path: "drop",
        purpose: ApiMediaUploadPurpose.DecisionEntry,
      })
    );
    expect(result.current.getServerUrls()).toEqual([
      "https://cdn.example/process.jpg",
    ]);
  });

  const uploadError = async (error: unknown) => {
    jest.mocked(multiPartUpload).mockRejectedValueOnce(error);
    const file = new File(["jpeg"], "process.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() => useMediaUpload(4));
    await act(async () => {
      await result.current.addFiles([file]);
    });
    return result.current.items[0]?.error;
  };

  it("shows the generic text for a server failure, never its response", async () => {
    const htmlPage = "<html><body>502 Bad Gateway</body></html>";
    await expect(
      uploadError(
        Object.assign(new Error(htmlPage), {
          status: 502,
          response: { status: 502, body: htmlPage },
        })
      )
    ).resolves.toBe("Upload failed");
    await expect(
      uploadError(
        Object.assign(new Error("Something went wrong"), { status: 500 })
      )
    ).resolves.toBe("Upload failed");
    await expect(uploadError("Bad Gateway")).resolves.toBe("Upload failed");
  });

  it("shows the upload-limit and size messages", async () => {
    await expect(
      uploadError(new MediaUploadRefusedError("Upload limit message"))
    ).resolves.toBe("Upload limit message");
    await expect(
      uploadError(new MediaUploadRefusedError("Size limit message"))
    ).resolves.toBe("Size limit message");
  });
});
