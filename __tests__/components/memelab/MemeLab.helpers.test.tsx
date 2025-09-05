import {
  getInitialRouterValues,
  printNftContent,
  printSortButtons,
  sortChanged,
} from "@/components/memelab/MemeLab";
import { LabExtendedData, LabNFT, VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { MemeLabSort } from "@/enums";
import { render, screen } from "@testing-library/react";

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

jest.mock("@/components/the-memes/TheMemes", () => ({
  SortButton: ({ sort, select }: any) => (
    <button data-testid={`sort-${sort}`} onClick={select} />
  ),
  printVolumeTypeDropdown: jest.fn(() => <div data-testid="volume-dropdown" />),
}));

const routerMock = (query: any) => ({ query, replace: jest.fn() } as any);

describe("MemeLab helpers", () => {
  test("getInitialRouterValues resolves from router", () => {
    const { initialSort, initialSortDir } = getInitialRouterValues(
      "DESC",
      "edition_size"
    );
    expect(initialSort).toBe(MemeLabSort.EDITION_SIZE);
    expect(initialSortDir).toBe(SortDirection.DESC);
  });

  test("printSortButtons renders buttons and dropdown", () => {
    render(
      <div>
        {printSortButtons(
          MemeLabSort.AGE,
          VolumeType.ALL_TIME,
          jest.fn(),
          jest.fn()
        )}
      </div>
    );
    expect(screen.getByTestId("sort-Age")).toBeInTheDocument();
    expect(screen.getByTestId("volume-dropdown")).toBeInTheDocument();
  });

  test("printNftContent shows floor price and highest offer", () => {
    const nft = {
      id: 1,
      floor_price: 2.5,
      highest_offer: 1.1,
      market_cap: 0,
      name: "n",
      animation: null,
    } as unknown as LabNFT;
    const meta: LabExtendedData = {
      id: 1,
      percent_unique: 0,
      percent_unique_cleaned: 0,
      hodlers: 0,
      metadata_collection: "",
      meme_references: [],
      name: "",
      website: "",
    };
    render(
      <div>
        {printNftContent(
          nft,
          MemeLabSort.FLOOR_PRICE,
          [meta],
          VolumeType.ALL_TIME
        )}
      </div>
    );
    expect(screen.getByText(/Floor Price/)).toBeInTheDocument();
    render(
      <div>
        {printNftContent(
          nft,
          MemeLabSort.HIGHEST_OFFER,
          [meta],
          VolumeType.ALL_TIME
        )}
      </div>
    );
    expect(screen.getByText(/Highest Offer/)).toBeInTheDocument();
  });

  test("sortChanged sorts by edition size and updates router", () => {
    const router = routerMock({});
    const nfts: LabNFT[] = [
      {
        id: 2,
        supply: 5,
        floor_price: 0,
        highest_offer: 0,
        market_cap: 0,
        name: "",
        animation: null,
      } as any,
      {
        id: 1,
        supply: 10,
        floor_price: 0,
        highest_offer: 0,
        market_cap: 0,
        name: "",
        animation: null,
      } as any,
    ];
    const metas: LabExtendedData[] = [];
    const setNfts = jest.fn();

    sortChanged(
      router,
      MemeLabSort.EDITION_SIZE,
      SortDirection.ASC,
      VolumeType.ALL_TIME,
      nfts,
      metas,
      setNfts
    );
    expect(router.replace).toHaveBeenCalled();
    const sorted = [...nfts].sort((a, b) => a.supply - b.supply || a.id - b.id);
    expect(setNfts).toHaveBeenLastCalledWith(sorted);
  });
});
