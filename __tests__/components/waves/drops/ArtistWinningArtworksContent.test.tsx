import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ArtistWinningArtworksContent } from "@/components/waves/drops/ArtistWinningArtworksContent";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";

const useUserWinningArtworksMock = jest.fn();
const useUserPrevoteCardsMock = jest.fn();

jest.mock("@/hooks/useUserWinningArtworks", () => ({
  useUserWinningArtworks: (props: unknown) => useUserWinningArtworksMock(props),
}));

jest.mock("@/hooks/useUserPrevoteCards", () => ({
  useUserPrevoteCards: (props: unknown) => useUserPrevoteCardsMock(props),
}));

jest.mock("@/helpers/waves/drop.helpers", () => ({
  convertApiDropToExtendedDrop: (drop: ApiDrop) => ({
    ...drop,
    type: "FULL",
    stableKey: drop.id,
    stableHash: drop.id,
  }),
}));

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: () => <div data-testid="media-display" />,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt="" {...props} />
  ),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: React.PropsWithChildren<{ readonly href: string }>) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

const user: ApiProfileMin = {
  id: "profile-id",
  handle: "kristopher",
  pfp: null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: 0,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  primary_address: "0xartist",
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: ["drop-1"],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};

const createWinnerDrop = (decisionTime: number): ApiDrop =>
  ({
    id: "drop-1",
    serial_no: 1,
    created_at: Date.UTC(2024, 0, 2),
    title: "Hometeam",
    author: {
      handle: "kristopher",
      primary_address: "0xartist",
    },
    parts: [
      {
        content: "Artwork",
        media: [],
      },
    ],
    metadata: [],
    wave: {
      id: "wave-1",
      voting_credit_type: "TDH",
    },
    rating: 52_822_010,
    top_raters: [],
    raters_count: 97,
    reply_to: null,
    winning_context: {
      place: 1,
      awards: [],
      decision_time: decisionTime,
      sale_time: null,
      sale_price: null,
      sale_price_currency: null,
    },
  }) as ApiDrop;

describe("ArtistWinningArtworksContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUserPrevoteCardsMock.mockReturnValue({
      prevoteCards: [],
      isLoading: false,
    });
  });

  it("does not render epoch as the win date when decision time is missing", () => {
    const drop = createWinnerDrop(0);
    useUserWinningArtworksMock.mockReturnValue({
      winningDrops: [drop],
      isLoading: false,
    });

    render(
      <ArtistWinningArtworksContent
        user={user}
        isOpen={true}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByText(/Won on/i)).not.toBeInTheDocument();
    expect(screen.queryByText("1/1/1970")).not.toBeInTheDocument();
    expect(
      screen.queryByText(new Date(drop.created_at).toLocaleDateString())
    ).not.toBeInTheDocument();
  });
});
