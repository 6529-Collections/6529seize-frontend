import { createMockAuthContext } from "@/__tests__/utils/testContexts";
import { AuthContext } from "@/components/auth/Auth";
import UserPageSubscriptionsUpcoming from "@/components/user/subscriptions/UserPageSubscriptionsUpcoming";
import {
  getUpcomingMintsAcrossSeasons,
  isMintingToday,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import type { NFTSubscription } from "@/generated/models/NFTSubscription";
import type { SubscriptionDetails } from "@/generated/models/SubscriptionDetails";
import * as localeFormat from "@/i18n/format";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import userEvent from "@testing-library/user-event";
import { useNowMinting } from "@/hooks/useNowMinting";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { MEMES_CONTRACT } from "@/constants/constants";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { useQuery } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

jest.mock("@/hooks/useMediaQuery");

jest.mock("@/hooks/useNowMinting", () => ({ useNowMinting: jest.fn() }));
jest.mock("@/hooks/useNextMintDrop", () => ({ useNextMintDrop: jest.fn() }));

const winnerImage =
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/test-winner/artwork.png";
const winnerThumbnail =
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/test-winner/200x200/artwork.png";
const nextMintResult: ReturnType<typeof useNextMintDrop> = {
  nextMint: null,
  nextMintTitle: null,
  waveId: "main-stage",
  nextDecisionTime: null,
  isReady: true,
  isSettingsLoaded: true,
  isFetching: false,
  isLoading: false,
};

// Include malformed API mappings at this fixture boundary to test rejection.
const matchingWinner = (cardId: unknown): ApiDropV2View =>
  ({
    submission_context: { meme_card_id: cardId },
    parts: [{ media: [{ url: winnerImage, mime_type: "image/png" }] }],
    metadata: [],
  }) as unknown as ApiDropV2View;

const mockNowMintingResult = {
  nft: undefined,
  isFetched: true,
  isFetching: false,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
};

const mockInvalidateQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const mockUpcomingRows = [
  {
    utcDay: new Date("2024-01-01T00:00:00Z"),
    instantUtc: new Date("2024-01-01T15:40:00Z"),
    meme: 201,
    seasonIndex: 1,
  },
  {
    utcDay: new Date("2024-01-02T00:00:00Z"),
    instantUtc: new Date("2024-01-02T15:40:00Z"),
    meme: 202,
    seasonIndex: 1,
  },
  {
    utcDay: new Date("2024-01-03T00:00:00Z"),
    instantUtc: new Date("2024-01-03T15:40:00Z"),
    meme: 203,
    seasonIndex: 1,
  },
  {
    utcDay: new Date("2024-01-04T00:00:00Z"),
    instantUtc: new Date("2024-01-04T15:40:00Z"),
    meme: 204,
    seasonIndex: 1,
  },
];

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  __esModule: true,
  formatFullDate: jest.fn((date: Date) => {
    const iso = date.toISOString().split("T")[0];
    const day = date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    return `${iso} / ${day}`;
  }),
  getUpcomingMintsAcrossSeasons: jest.fn(() => mockUpcomingRows),
  isMintingToday: jest.fn(() => false),
  displayedSeasonNumberFromIndex: jest.fn((idx: number) => idx + 1),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const mockSubscriptions: NFTSubscription[] = [
  {
    token_id: 1,
    contract: "0x123",
    subscribed: true,
  } as NFTSubscription,
  {
    token_id: 2,
    contract: "0x123",
    subscribed: false,
  } as NFTSubscription,
  {
    token_id: 3,
    contract: "0x123",
    subscribed: true,
  } as NFTSubscription,
  {
    token_id: 4,
    contract: "0x123",
    subscribed: false,
  } as NFTSubscription,
];

const FIXED_TIMESTAMP = 1609459200000;

const mockDetails: SubscriptionDetails = {
  consolidation_key: "testuser",
  last_update: FIXED_TIMESTAMP,
  balance: 1,
  automatic: true,
  subscribe_all_editions: false,
  subscription_eligibility_count: 1,
};

describe("UserPageSubscriptionsUpcoming", () => {
  const useQueryMock = useQuery as jest.Mock;
  const mockRefresh = jest.fn();
  const mockRequestAuth = jest.fn();
  const mockSetToast = jest.fn();

  beforeEach(() => {
    jest.mocked(useMediaQuery).mockReturnValue(false);
    jest.mocked(isMintingToday).mockReturnValue(false);
    jest
      .mocked(getUpcomingMintsAcrossSeasons)
      .mockReturnValue(mockUpcomingRows);
    jest.mocked(useNowMinting).mockReturnValue(mockNowMintingResult);
    jest.mocked(useNextMintDrop).mockReturnValue(nextMintResult);
    useQueryMock.mockImplementation(({ enabled }) => ({
      data: enabled
        ? {
            phase: "Phase 1",
            phase_position: 100,
            phase_subscriptions: 500,
            airdrop_address: "0xabc123",
          }
        : null,
    }));
    mockRequestAuth.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props: Partial<any> = {}) => {
    const authContext = createMockAuthContext({
      requestAuth: mockRequestAuth,
      setToast: mockSetToast,
    });

    const defaultProps = {
      profileKey: "testuser",
      details: mockDetails,
      memes_subscriptions: mockSubscriptions,
      readonly: false,
      refresh: mockRefresh,
      ...props,
    };

    return render(
      <AuthContext.Provider value={authContext}>
        <UserPageSubscriptionsUpcoming {...defaultProps} />
      </AuthContext.Provider>
    );
  };

  it("renders upcoming drops title", () => {
    renderComponent();
    expect(screen.getByText("Upcoming Drops")).toBeInTheDocument();
  });

  it("shows loading instead of an empty result while the request is pending", () => {
    renderComponent({ memes_subscriptions: [], loading: true });
    expect(screen.getByText("Loading upcoming drops")).toBeInTheDocument();
    expect(
      screen.queryByText("No upcoming drops found")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
  });

  it("shows unavailable instead of an empty result after a failed request", () => {
    renderComponent({ memes_subscriptions: [], error: true });
    expect(screen.getByText("Unavailable")).toBeVisible();
    expect(
      screen.queryByText("No upcoming drops found")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("preserves the empty message for a successful empty response", () => {
    renderComponent({ memes_subscriptions: [], loading: false, error: false });
    expect(screen.getByText("No upcoming drops found")).toBeVisible();
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
  });

  it("does not keep saying Loading settings after the settings request fails", () => {
    renderComponent({ details: undefined, detailsError: true });
    expect(screen.queryByText("Loading settings")).not.toBeInTheDocument();
    expect(screen.getAllByText("Unavailable")).toHaveLength(4);
    expect(screen.getByText("The Memes #1")).toBeVisible();
  });

  it("shows the season on every row, including rows revealed by Show More", () => {
    renderComponent();
    expect(screen.getAllByText("SZN2")).toHaveLength(3);
    expect(
      screen.getByRole("heading", { name: "Upcoming Drops" }).parentElement
    ).not.toHaveTextContent("SZN");
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    expect(screen.getAllByText("SZN2")).toHaveLength(4);
  });

  it("keeps season changes identifiable when the expanded list spans seasons", () => {
    jest
      .mocked(getUpcomingMintsAcrossSeasons)
      .mockReturnValue([
        ...mockUpcomingRows.slice(0, 3),
        { ...mockUpcomingRows[3]!, seasonIndex: 2 },
      ]);
    renderComponent();
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    expect(screen.getAllByText("SZN2")).toHaveLength(3);
    expect(screen.getAllByText("SZN3")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Upcoming Drops" }).parentElement
    ).not.toHaveTextContent("SZN");
    fireEvent.click(screen.getByRole("button", { name: "Show Less" }));
    expect(screen.queryByText("SZN3")).not.toBeInTheDocument();
  });

  it("opens the full phone list in a sheet and restores focus on close", async () => {
    jest.mocked(useMediaQuery).mockReturnValue(true);
    const user = userEvent.setup();
    renderComponent();
    const opener = screen.getByRole("button", { name: "Show More" });
    await user.click(opener);
    const sheet = screen.getByRole("dialog", { name: "Upcoming Drops" });
    await waitFor(() =>
      expect(within(sheet).getByRole("heading")).toHaveFocus()
    );
    expect(within(sheet).getByText("The Memes #4")).toBeVisible();
    expect(within(sheet).getAllByRole("switch")).toHaveLength(4);
    await user.click(within(sheet).getByRole("button", { name: "Close" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await waitFor(() => expect(opener).toHaveFocus());
    expect(screen.queryByText("The Memes #4")).not.toBeInTheDocument();
    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it("places one amber funded boundary after its drop in both list views", () => {
    renderComponent({ coverage: { funded_through: { token_id: 3 } } });
    const marker = screen.getByText("Funded through");
    expect(marker).toHaveClass("tw-text-amber-200");
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    expect(screen.getAllByText("Funded through")).toHaveLength(1);
    expect(
      within(marker).getByRole("link", { name: "The Memes #3" })
    ).toHaveAttribute("href", "/the-memes/3");
    const rowTitle = screen
      .getAllByRole("link", { name: "The Memes #3" })
      .find((link) => !marker.contains(link));
    expect(rowTitle).toBeDefined();
    expect(
      rowTitle!.compareDocumentPosition(marker) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it.each([false, true])(
    "places one next-unfunded boundary before its drop when none are funded (readonly: %s)",
    (readonly) => {
      renderComponent({
        readonly,
        coverage: { next_unfunded: { token_id: 2 } },
      });
      const marker = screen.getByText("Next unfunded");
      expect(marker).toHaveClass("tw-text-amber-200");
      expect(
        within(marker).getByRole("link", { name: "The Memes #2" })
      ).toHaveAttribute("href", "/the-memes/2");
      const rowTitle = screen
        .getAllByRole("link", { name: "The Memes #2" })
        .find((link) => !marker.contains(link));
      expect(rowTitle).toBeDefined();
      expect(
        marker.compareDocumentPosition(rowTitle!) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
      expect(screen.queryByText("Unfunded")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Top up" })
      ).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Show More" }));
      expect(screen.getAllByText("Next unfunded")).toHaveLength(1);
      expect(screen.queryByText("Unfunded")).not.toBeInTheDocument();
      if (readonly) {
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
        expect(screen.getAllByText("Subscribed", { exact: true })).toHaveLength(
          2
        );
      } else {
        expect(
          screen.getByRole("switch", {
            name: "Toggle subscription for The Memes #1",
          })
        ).toBeChecked();
        expect(
          screen.getByRole("switch", {
            name: "Toggle subscription for The Memes #2",
          })
        ).not.toBeChecked();
        expect(
          screen.getByRole("switch", {
            name: "Toggle subscription for The Memes #3",
          })
        ).toBeChecked();
      }
    }
  );

  it("does not duplicate the boundary at the next unfunded drop", () => {
    renderComponent({
      coverage: {
        funded_through: { token_id: 1 },
        next_unfunded: { token_id: 3 },
      },
    });
    expect(screen.getAllByText("Funded through")).toHaveLength(1);
    expect(screen.queryByText("Next unfunded")).not.toBeInTheDocument();
    expect(screen.queryByText("Unfunded")).not.toBeInTheDocument();
  });

  it("reveals a later funding boundary with Show More", () => {
    renderComponent({ coverage: { funded_through: { token_id: 4 } } });
    expect(screen.queryByText("Funded through")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show More" }));
    expect(screen.getAllByText("Funded through")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Show Less" }));
    expect(screen.queryByText("Funded through")).not.toBeInTheDocument();
  });

  it("does not request current artwork on days without a Minting Today row", () => {
    renderComponent();
    expect(useNowMinting).not.toHaveBeenCalled();
    expect(useNextMintDrop).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "links every upcoming drop, including expanded rows (readonly=%s)",
    (readonly) => {
      renderComponent({ readonly });
      for (const id of [1, 2, 3]) {
        expect(
          screen.getByRole("link", { name: `The Memes #${id}` })
        ).toHaveAttribute("href", `/the-memes/${id}`);
      }
      fireEvent.click(screen.getByRole("button", { name: "Show More" }));
      expect(
        screen.getByRole("link", { name: "The Memes #4" })
      ).toHaveAttribute("href", "/the-memes/4");
    }
  );

  it.each([false, true])(
    "shows the matching winner before indexing and keeps the row if its image fails (readonly=%s)",
    (readonly) => {
      jest.mocked(isMintingToday).mockReturnValue(true);
      jest.mocked(useNowMinting).mockReturnValue({
        ...mockNowMintingResult,
        nft: {
          id: 574,
          contract: MEMES_CONTRACT,
          thumbnail: "https://example.com/previous.jpg",
        } as ApiMemesExtendedData,
      });
      jest.mocked(useNextMintDrop).mockReturnValue({
        ...nextMintResult,
        nextMint: matchingWinner(575),
      });
      const { container } = renderComponent({
        readonly,
        memes_subscriptions: [
          { ...mockSubscriptions[0], token_id: 575, contract: MEMES_CONTRACT },
        ],
      });
      const image = container.querySelector("img");
      expect(image).toHaveAttribute("src", winnerThumbnail);
      expect(image).toHaveAttribute("width", "80");
      expect(image).toHaveAttribute("height", "113");
      expect(
        screen.getByRole("link", { name: "The Memes #575" })
      ).toHaveAttribute("href", "/the-memes/575");
      expect(
        screen.getByRole("button", { name: "Minting Today" })
      ).toBeVisible();
      if (readonly)
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
      else
        expect(
          screen.getByRole("switch", {
            name: "Toggle subscription for The Memes #575",
          })
        ).toBeDisabled();
      fireEvent.error(image!);
      expect(container.querySelector("img")).toHaveAttribute(
        "src",
        winnerThumbnail.replace("200x200", "AUTOx450")
      );
      fireEvent.error(container.querySelector("img")!);
      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "The Memes #575" })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Minting Today" })
      ).toBeVisible();
    }
  );

  it("uses only resized GIF previews, including when every preview fails", () => {
    jest.mocked(isMintingToday).mockReturnValue(true);
    const original = winnerImage.replace(".png", ".gif");
    const winner = matchingWinner(1);
    jest.mocked(useNextMintDrop).mockReturnValue({
      ...nextMintResult,
      nextMint: {
        ...winner,
        parts: [
          {
            ...winner.parts[0]!,
            media: [{ url: original, mime_type: "image/gif" }],
          },
        ],
      },
    });
    const { container } = renderComponent({
      readonly: true,
      memes_subscriptions: [
        { ...mockSubscriptions[0], contract: MEMES_CONTRACT },
      ],
    });
    for (const size of [
      "200x200_gifv2",
      "200x200",
      "AUTOx450_gifv2",
      "AUTOx450",
    ]) {
      const image = container.querySelector("img");
      expect(image).toHaveAttribute(
        "src",
        original.replace("artwork.gif", `${size}/artwork.gif`)
      );
      expect(image).not.toHaveAttribute("src", original);
      fireEvent.error(image!);
    }
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The Memes #1" })).toBeVisible();
  });

  it.each([
    { token: 575, card: 574 },
    { token: 575, card: 576 },
    { token: 575, card: null },
    { token: 575, card: undefined },
    { token: 575, card: "575" },
    { token: 575, card: 575.5 },
    { token: 0, card: null },
    { token: 0, card: "" },
    { token: 0, card: 0 },
    { token: -1, card: -1 },
  ])(
    "omits a winner that is not confirmed as Meme $token (card=$card)",
    ({ token, card }) => {
      jest.mocked(isMintingToday).mockReturnValue(true);
      jest.mocked(useNextMintDrop).mockReturnValue({
        ...nextMintResult,
        nextMint: matchingWinner(card),
      });
      const { container } = renderComponent({
        readonly: true,
        memes_subscriptions: [
          {
            ...mockSubscriptions[0],
            token_id: token,
            contract: MEMES_CONTRACT,
          },
        ],
      });
      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: `The Memes #${token}` })
      ).toBeVisible();
    }
  );

  it("shows matching current artwork and keeps the mint-day lock when the image fails", () => {
    jest.mocked(isMintingToday).mockReturnValue(true);
    jest.mocked(useNowMinting).mockReturnValue({
      ...mockNowMintingResult,
      nft: {
        id: 1,
        contract: MEMES_CONTRACT.toLowerCase(),
        thumbnail: "https://example.com/meme-1.jpg",
      } as ApiMemesExtendedData,
    });
    jest.mocked(useNextMintDrop).mockReturnValue({
      ...nextMintResult,
      nextMint: matchingWinner(1),
    });
    const { container } = renderComponent({
      memes_subscriptions: [
        { ...mockSubscriptions[0], contract: MEMES_CONTRACT },
      ],
    });
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "https://example.com/meme-1.jpg");
    expect(
      screen.getByRole("switch", {
        name: "Toggle subscription for The Memes #1",
      })
    ).toBeDisabled();
    fireEvent.error(image!);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Minting Today" })).toBeVisible();
    expect(screen.getByText("The Memes #1")).toBeVisible();
    expect(
      screen.getByRole("switch", {
        name: "Toggle subscription for The Memes #1",
      })
    ).toBeDisabled();
  });

  it.each([
    { id: 2, contract: "0x123" },
    { id: 1, contract: "0x456" },
  ])(
    "omits artwork for a different token or contract ($id, $contract)",
    (nft) => {
      jest.mocked(isMintingToday).mockReturnValue(true);
      jest.mocked(useNowMinting).mockReturnValue({
        ...mockNowMintingResult,
        nft: {
          ...nft,
          thumbnail: "https://example.com/other.jpg",
        } as ApiMemesExtendedData,
      });
      const { container } = renderComponent({ readonly: true });
      expect(container.querySelector("img")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Minting Today" })
      ).toBeVisible();
      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    }
  );

  it("does not use a Main Stage winner for another contract", () => {
    jest.mocked(isMintingToday).mockReturnValue(true);
    jest.mocked(useNextMintDrop).mockReturnValue({
      ...nextMintResult,
      nextMint: matchingWinner(1),
    });
    const { container } = renderComponent({ readonly: true });
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it.each([true, false])(
    "uses a non-image winner's preview only when available (hasPreview=%s)",
    (hasPreview) => {
      jest.mocked(isMintingToday).mockReturnValue(true);
      const winner = matchingWinner(1);
      jest.mocked(useNextMintDrop).mockReturnValue({
        ...nextMintResult,
        nextMint: {
          ...winner,
          parts: [
            {
              ...winner.parts[0]!,
              media: [
                { url: "https://example.com/art.mp4", mime_type: "video/mp4" },
              ],
            },
          ],
          metadata: hasPreview
            ? [
                {
                  data_key: "additional_media",
                  data_value: JSON.stringify({ preview_image: winnerImage }),
                },
              ]
            : [],
        },
      });
      const { container } = renderComponent({
        readonly: true,
        memes_subscriptions: [
          { ...mockSubscriptions[0], contract: MEMES_CONTRACT },
        ],
      });
      if (hasPreview)
        expect(container.querySelector("img")).toHaveAttribute(
          "src",
          winnerThumbnail
        );
      else expect(container.querySelector("img")).not.toBeInTheDocument();
    }
  );

  it.each([
    { automatic: false, text: "You have to opt-in to each specific drop" },
    {
      automatic: true,
      text: "Automatic airdrops of all eligible drops unless you opt-out",
    },
  ])(
    "shows the mode explanation only to the owner (automatic=$automatic)",
    ({ automatic, text }) => {
      const details = { ...mockDetails, automatic };
      const owner = renderComponent({ details });
      expect(screen.getByText(text)).toBeVisible();
      owner.unmount();

      renderComponent({ details, readonly: true });
      expect(screen.queryByText(text)).not.toBeInTheDocument();
      expect(screen.getByText("The Memes #1")).toBeVisible();
    }
  );

  it("displays first 3 subscriptions by default", () => {
    renderComponent();
    expect(screen.getByText("The Memes #1")).toBeInTheDocument();
    expect(screen.getByText("The Memes #2")).toBeInTheDocument();
    expect(screen.getByText("The Memes #3")).toBeInTheDocument();
    expect(screen.queryByText("The Memes #4")).not.toBeInTheDocument();
  });

  it("shows expand button when there are more than 3 subscriptions", () => {
    renderComponent();
    expect(screen.getByText("Show More")).toBeInTheDocument();
  });

  it("expands to show all subscriptions when Show More clicked", () => {
    renderComponent();

    fireEvent.click(screen.getByText("Show More"));

    expect(screen.getByText("The Memes #4")).toBeInTheDocument();
    expect(screen.getByText("Show Less")).toBeInTheDocument();
  });

  it("collapses back to 3 subscriptions when Show Less clicked", () => {
    renderComponent();

    fireEvent.click(screen.getByText("Show More"));
    fireEvent.click(screen.getByText("Show Less"));

    expect(screen.queryByText("The Memes #4")).not.toBeInTheDocument();
    expect(screen.getByText("Show More")).toBeInTheDocument();
  });

  it("displays subscription toggles in correct state", () => {
    renderComponent();

    const toggles = screen.getAllByRole("button");
    expect(toggles.length).toBeGreaterThan(0);
  });

  it("shows phase information for first subscription", () => {
    renderComponent();

    expect(screen.getByText(/Phase: Phase 1/)).toBeInTheDocument();
    expect(screen.getByText(/Subscription Position: 100/)).toBeInTheDocument();
    expect(screen.getByText(/Airdrop Address: 0xabc123/)).toBeInTheDocument();
  });

  it("does not show phase information when not available", () => {
    useQueryMock.mockReturnValue({
      data: null,
    });

    renderComponent();

    expect(screen.queryByText(/Phase:/)).not.toBeInTheDocument();
  });

  it("displays dates for subscriptions", () => {
    renderComponent();

    expect(screen.getByText("Mon, Jan 1, 2024")).toBeInTheDocument();
    expect(screen.getByText("Tue, Jan 2, 2024")).toBeInTheDocument();
  });

  it("formats upcoming mint days as UTC calendar days", () => {
    const format = jest.spyOn(localeFormat, "formatUtcDate");
    renderComponent();
    expect(format).toHaveBeenCalledWith("en-US", mockUpcomingRows[0]!.utcDay, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    format.mockRestore();
  });

  it("shows minting today message when applicable", () => {
    const {
      isMintingToday,
    } = require("@/components/meme-calendar/meme-calendar.helpers");
    isMintingToday.mockReturnValue(true);

    renderComponent();

    expect(screen.getByText(/Minting Today/)).toBeInTheDocument();
  });

  it("shows saved subscription statuses instead of toggles in readonly mode", () => {
    renderComponent({ readonly: true });
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.getAllByText("Subscribed", { exact: true })).toHaveLength(2);
    expect(screen.getByText("Not subscribed", { exact: true })).toBeVisible();
    fireEvent.click(screen.getByText("Not subscribed", { exact: true }));
    expect(mockRequestAuth).not.toHaveBeenCalled();
  });

  it("handles empty subscriptions list", () => {
    renderComponent({ memes_subscriptions: [] });

    expect(screen.getByText("Upcoming Drops")).toBeInTheDocument();
    expect(screen.queryByText("Show More")).not.toBeInTheDocument();
  });

  it("does not show expand button when no subscriptions", () => {
    renderComponent({ memes_subscriptions: [] });

    expect(screen.queryByText("Show More")).not.toBeInTheDocument();
  });

  it("calls query for final subscription data only for first subscription", () => {
    renderComponent();

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["consolidation-final-subscription", "testuser-0x123-1"],
        enabled: true,
        retry: false,
      })
    );
  });
});
