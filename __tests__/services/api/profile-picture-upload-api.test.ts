import { commonApiPostForm } from "@/services/api/common-api";
import { uploadProfilePicture } from "@/services/api/profile-picture-upload-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiPostForm: jest.fn(),
}));

const postForm = jest.mocked(commonApiPostForm);

describe("uploadProfilePicture", () => {
  beforeEach(() => {
    postForm.mockReset();
  });

  it("posts the file to the API and returns the pinned ipfs url", async () => {
    const file = new File(["png"], "me.png", { type: "image/png" });
    postForm.mockResolvedValue({ pfp_url: "ipfs://QmUploadedPicture" });

    await expect(uploadProfilePicture(file)).resolves.toBe(
      "ipfs://QmUploadedPicture"
    );
    expect(postForm).toHaveBeenCalledTimes(1);
    const [{ endpoint, body }] = postForm.mock.calls[0]!;
    expect(endpoint).toBe("profiles/pfp/ipfs");
    expect(body.get("pfp")).toBe(file);
  });

  it.each([
    [{ pfp_url: "https://example.test/me.png" }],
    [{ pfp_url: "" }],
    [{}],
  ])("rejects an unexpected response %j", async (response) => {
    postForm.mockResolvedValue(response);

    await expect(
      uploadProfilePicture(new File(["png"], "me.png"))
    ).rejects.toThrow("Profile picture upload returned an unexpected URL");
  });

  it("passes API errors through to the caller", async () => {
    postForm.mockRejectedValue(new Error("File is too large"));

    await expect(
      uploadProfilePicture(new File(["png"], "me.png"))
    ).rejects.toThrow("File is too large");
  });
});
