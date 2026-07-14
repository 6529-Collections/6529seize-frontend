import MemePageMainStageSubmissionLink from "@/components/the-memes/MemePageMainStageSubmissionLink";
import { commonApiFetch } from "@/services/api/common-api";
import { render, screen, waitFor } from "@testing-library/react";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: { memes_wave_id: "main-stage-wave" },
  }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

describe("MemePageMainStageSubmissionLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("links a mapped Meme card back to its Main Stage submission", async () => {
    commonApiFetchMock.mockResolvedValue({
      meme_card_id: 521,
      drop_id: "drop-1",
    });

    render(<MemePageMainStageSubmissionLink memeCardId={521} locale="en-US" />);

    const link = await screen.findByRole("link", {
      name: "View winning submission",
    });
    expect(link).toHaveAttribute("href", "/waves/main-stage-wave?drop=drop-1");
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "meme-cards/521/drop",
        errorMode: "structured",
        includeWalletAuth: false,
      })
    );
  });

  it("stays hidden when no Main Stage mapping exists", async () => {
    commonApiFetchMock.mockRejectedValue(new Error("Not found"));

    render(<MemePageMainStageSubmissionLink memeCardId={1} locale="en-US" />);

    await waitFor(() => expect(commonApiFetchMock).toHaveBeenCalled());
    expect(
      screen.queryByRole("link", { name: "View winning submission" })
    ).not.toBeInTheDocument();
  });
});
