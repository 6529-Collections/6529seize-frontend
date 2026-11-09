import { act, renderHook } from "@testing-library/react";
import { useMediaUpload } from "@/components/waves/memes/submission/hooks/useMediaUpload";
import { multiPartUpload } from "@/components/waves/create-wave/services/multiPartUpload";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";

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
});
