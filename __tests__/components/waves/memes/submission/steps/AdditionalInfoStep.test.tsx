import { render, screen } from "@testing-library/react";
import AdditionalInfoStep from "@/components/waves/memes/submission/steps/AdditionalInfoStep";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

describe("AdditionalInfoStep", () => {
  const baseTraits = {
    title: "Title",
    description: "Description",
  } as TraitsData;

  const baseProps = {
    traits: baseTraits,
    airdropEntries: [
      {
        id: "a1",
        address: "0x1234567890123456789012345678901234567890",
        count: 20,
      },
    ],
    onAirdropEntriesChange: jest.fn(),
    paymentInfo: {
      payment_address: "0x1234567890123456789012345678901234567890",
      has_designated_payee: false,
      designated_payee_name: "",
    },
    onPaymentInfoChange: jest.fn(),
    allowlistBatches: [],
    supportingMedia: [],
    artworkCommentary: "commentary",
    aboutArtist: "about",
    previewImage: "",
    promoVideo: "",
    requiresPreviewImage: false,
    requiresPromoVideoOption: false,
    previewRequiredMediaType: null,
    onBatchesChange: jest.fn(),
    onSupportingMediaChange: jest.fn(),
    onPreviewImageChange: jest.fn(),
    onPromoVideoChange: jest.fn(),
    onArtworkCommentaryChange: jest.fn(),
    onAboutArtistChange: jest.fn(),
    onBack: jest.fn(),
    onPreview: jest.fn(),
    onSubmit: jest.fn(),
    isSubmitting: false,
  };

  it("disables preview and submit when metadata exceeds 5000 chars", () => {
    render(
      <AdditionalInfoStep {...baseProps} artworkCommentary={"x".repeat(5001)} />
    );

    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Submit Artwork" })
    ).toBeDisabled();
  });
});
