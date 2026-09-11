import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdditionalInfoStep from "@/components/waves/memes/submission/steps/AdditionalInfoStep";
import type { TraitsData } from "@/components/waves/memes/submission/types/TraitsData";

jest.mock("@/hooks/useEnsResolution", () => ({
  useEnsResolution: ({ initialValue = "" } = {}) => ({
    inputValue: initialValue,
    address: initialValue,
    handleInputChange: jest.fn(),
    ensNameQuery: { isLoading: false, isError: false },
    ensAddressQuery: { isLoading: false, isError: false },
  }),
}));

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
    identity: {
      status: "eligible",
      profileStatus: "eligible",
      profile: { id: "profile-a", handle: "alice", display: "Alice" },
      address: "0x1234567890123456789012345678901234567890",
      walletName: "MetaMask",
      canSubmit: true,
      connectWallet: jest.fn(),
      verifyProfile: jest.fn(),
      retryEligibility: jest.fn(),
    } as any,
    isSubmitting: false,
    submissionPhase: "idle" as const,
    uploadProgress: 0,
  };

  it("disables preview and submit when metadata exceeds 5000 chars", () => {
    render(
      <AdditionalInfoStep {...baseProps} artworkCommentary={"x".repeat(5001)} />
    );

    expect(screen.getByRole("button", { name: "Preview" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Submit Artwork" })
    ).toBeDisabled();

    expect(screen.getByRole("button", { name: "Back" })).toHaveClass(
      "tw-h-10",
      "tw-text-sm",
      "!tw-bg-transparent",
      "!tw-border-transparent"
    );
    expect(screen.getByRole("button", { name: "Preview" })).toHaveClass(
      "tw-h-10",
      "tw-text-sm",
      "tw-bg-white/[0.07]"
    );
    expect(screen.getByRole("button", { name: "Submit Artwork" })).toHaveClass(
      "tw-h-10",
      "tw-text-sm",
      "tw-bg-iron-200"
    );
  });

  it("keeps the text Back action operable and disabled during submission", async () => {
    const user = userEvent.setup();
    const onBack = jest.fn();
    const { rerender } = render(
      <AdditionalInfoStep {...baseProps} onBack={onBack} />
    );
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);

    rerender(
      <AdditionalInfoStep {...baseProps} onBack={onBack} isSubmitting />
    );
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
