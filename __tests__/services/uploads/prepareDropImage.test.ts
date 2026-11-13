/** @jest-environment node */
import { getWalletAddress, getWalletRole } from "@/services/auth/auth.utils";
import { ApiMediaUploadPurpose } from "@/generated/models/ApiMediaUploadPurpose";
import {
  getPreparedDropImage,
  getPreparedDropImagePreview,
  rememberPreparedDropImage,
  getDropUploadOwner,
  validateDropImageSignature,
} from "@/services/uploads/prepareDropImage";

jest.mock("@/services/auth/auth.utils", () => ({
  getWalletAddress: jest.fn(() => "account-one"),
  getWalletRole: jest.fn(() => null),
}));

const avifHeader = Buffer.from(
  "00000018667479706176696600000000617669666d696631",
  "hex"
);

describe("AVIF selection validation", () => {
  it("accepts a still AVIF header with an empty browser MIME", async () => {
    await expect(
      validateDropImageSignature(new File([avifHeader], "photo.AVIF"))
    ).resolves.toBeUndefined();
  });

  it("rejects AVIF bytes renamed to JPEG", async () => {
    await expect(
      validateDropImageSignature(
        new File([avifHeader], "photo.jpg", { type: "image/jpeg" })
      )
    ).rejects.toThrow("does not match");
  });

  it("rejects other bytes named AVIF", async () => {
    await expect(
      validateDropImageSignature(new File(["not an avif"], "photo.avif"))
    ).rejects.toThrow("does not match");
  });

  it("rejects animation from its file-type header", async () => {
    const animated = Buffer.from(avifHeader);
    animated.write("avis", 8);
    await expect(
      validateDropImageSignature(new File([animated], "animation.avif"))
    ).rejects.toThrow("Animated AVIF");
  });

  it.each([8, 17, 4097, 0xffffffff])(
    "rejects an invalid file-type box size of %s",
    async (size) => {
      const header = Buffer.from(avifHeader);
      header.writeUInt32BE(size, 0);
      await expect(
        validateDropImageSignature(new File([header], "photo.avif"))
      ).rejects.toThrow("does not match");
    }
  );
});

describe("prepared upload reuse", () => {
  const media = {
    url: "https://media.example/still.webp",
    mime_type: "image/webp",
  };

  beforeEach(() => {
    jest.mocked(getWalletAddress).mockReturnValue("account-one");
    jest.mocked(getWalletRole).mockReturnValue(null);
  });

  it("only reuses the prepared upload for the uploader's account and proxy", () => {
    const file = new File([avifHeader], "still.avif");
    rememberPreparedDropImage(
      file,
      media,
      getDropUploadOwner(),
      ApiMediaUploadPurpose.Chat
    );
    expect(getPreparedDropImage(file, ApiMediaUploadPurpose.Chat)).toBe(media);
    expect(getPreparedDropImagePreview(file)).toBe(media);
    jest.mocked(getWalletAddress).mockReturnValue("account-two");
    expect(
      getPreparedDropImage(file, ApiMediaUploadPurpose.Chat)
    ).toBeUndefined();
    expect(getPreparedDropImagePreview(file)).toBeUndefined();
    jest.mocked(getWalletAddress).mockReturnValue("account-one");
    jest.mocked(getWalletRole).mockReturnValue("proxy-id");
    expect(
      getPreparedDropImage(file, ApiMediaUploadPurpose.Chat)
    ).toBeUndefined();
  });

  it("does not reuse a chat upload for a decision entry", () => {
    const file = new File([avifHeader], "chat.avif");
    rememberPreparedDropImage(
      file,
      media,
      getDropUploadOwner(),
      ApiMediaUploadPurpose.Chat
    );
    expect(
      getPreparedDropImage(file, ApiMediaUploadPurpose.DecisionEntry)
    ).toBeUndefined();
    expect(getPreparedDropImage(file, ApiMediaUploadPurpose.Chat)).toBe(media);
  });

  it("does not reuse a decision-entry upload for chat", () => {
    const file = new File([avifHeader], "entry.avif");
    rememberPreparedDropImage(
      file,
      media,
      getDropUploadOwner(),
      ApiMediaUploadPurpose.DecisionEntry
    );
    expect(
      getPreparedDropImage(file, ApiMediaUploadPurpose.Chat)
    ).toBeUndefined();
    expect(
      getPreparedDropImage(file, ApiMediaUploadPurpose.DecisionEntry)
    ).toBe(media);
    // The composer's own preview may still show it; it is never posted.
    expect(getPreparedDropImagePreview(file)).toBe(media);
  });
});
