import {
  getInitialRouterValues,
  printNftContent,
  printSortButtons,
} from "@/components/memelab/MemeLab";
import type { LabExtendedData, LabNFT} from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { MemeLabSort } from "@/enums";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock helper functions
jest.mock("@/helpers/Helpers", () => ({
  printMintDate: jest.fn((date: Date | string) => {
    if (!date) return "-";
    return "Jan 1, 2023 (1 year ago)";
  }),
  numberWithCommas: jest.fn((num: number) => num.toLocaleString()),
  getValuesForVolumeType: jest.fn((volumeType: VolumeType, nft: any) => {
    switch (volumeType) {
      case VolumeType.HOURS_24:
        return nft.total_volume_last_24_hours || 0;
      case VolumeType.DAYS_7:
        return nft.total_volume_last_7_days || 0;
      case VolumeType.DAYS_30:
        return nft.total_volume_last_1_month || 0;
      default:
        return nft.total_volume || 0;
    }
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

function createNft(): LabNFT {
  return {
    id: 1,
    contract: "0x",
    created_at: new Date(),
    mint_price: 0,
    supply: 1,
    name: "N",
    collection: "",
    token_type: "",
    description: "",
    artist: "artist",
    artist_seize_handle: "",
    uri: "",
    icon: "",
    thumbnail: "",
    scaled: "",
    image: "",
    animation: "",
    market_cap: 1,
    floor_price: 2,
    total_volume_last_24_hours: 3,
    total_volume_last_7_days: 4,
    total_volume_last_1_month: 5,
    total_volume: 6,
    highest_offer: 7,
    meme_references: [],
  };
}

const nftMeta: LabExtendedData = {
  id: 1,
  created_at: new Date(),
  collection_size: 0,
  edition_size: 10,
  edition_size_rank: 0,
  museum_holdings: 0,
  museum_holdings_rank: 0,
  edition_size_cleaned: 10,
  edition_size_cleaned_rank: 0,
  hodlers: 5,
  hodlers_rank: 0,
  percent_unique: 0.5,
  percent_unique_rank: 0,
  percent_unique_cleaned: 0.4,
  percent_unique_cleaned_rank: 0,
  burnt: 0,
  edition_size_not_burnt: 0,
  edition_size_not_burnt_rank: 0,
  percent_unique_not_burnt: 0,
  percent_unique_not_burnt_rank: 0,
  meme_references: [],
  metadata_collection: "col",
  name: "n",
  website: "",
};

describe("MemeLab utilities", () => {
  it("parses router query for initial values", () => {
    const { initialSortDir, initialSort } = getInitialRouterValues(
      "desc",
      "collectors"
    );
    expect(initialSort).toBe(MemeLabSort.HODLERS);
    expect(initialSortDir).toBe(SortDirection.DESC);
  });

  it("falls back to defaults for invalid router values", () => {
    const { initialSortDir, initialSort } = getInitialRouterValues(
      "bad",
      "bad"
    );
    expect(initialSort).toBe(MemeLabSort.AGE);
    expect(initialSortDir).toBe(SortDirection.ASC);
  });

  it("renders sort buttons and triggers callbacks", async () => {
    const setSort = jest.fn();
    const setVolume = jest.fn();
    render(
      <div>
        {printSortButtons(
          MemeLabSort.AGE,
          VolumeType.ALL_TIME,
          setSort,
          setVolume
        )}
      </div>
    );
    await userEvent.click(screen.getByRole("button", { name: "Edition Size" }));
    expect(setSort).toHaveBeenCalled();
  });

  it("prints nft content based on sort", () => {
    const nft = createNft();
    render(
      <div>
        {printNftContent(
          nft,
          MemeLabSort.FLOOR_PRICE,
          [nftMeta],
          VolumeType.ALL_TIME
        )}
      </div>
    );
    expect(screen.getByText(/Floor Price/)).toBeInTheDocument();
  });

  it("prints volume info for selected period", () => {
    const nft = createNft();
    const { container } = render(
      <div>
        {printNftContent(nft, MemeLabSort.VOLUME, [nftMeta], VolumeType.DAYS_7)}
      </div>
    );
    expect(container.textContent).toContain("Volume (7 Days):");
  });
});
