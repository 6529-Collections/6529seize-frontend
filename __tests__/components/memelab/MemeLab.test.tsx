import React from "react";
import { render, screen } from "@testing-library/react";
import {
  getInitialRouterValues,
  printSortButtons,
  printNftContent,
  sortChanged,
} from "../../../components/memelab/MemeLab";
import { MemeLabSort } from "../../../enums";
import { SortDirection } from "../../../entities/ISort";
import { VolumeType, LabNFT, LabExtendedData } from "../../../entities/INFT";

jest.mock("../../../components/the-memes/TheMemes", () => ({
  SortButton: (p: any) => (
    <button data-testid="sort" onClick={() => p.select()}>
      {p.sort}
    </button>
  ),
  printVolumeTypeDropdown: () => <div data-testid="volume" />,
}));

jest.mock("../../components/memelab/MemeLab.module.scss", () => ({}));

describe("MemeLab utilities", () => {
  it("getInitialRouterValues parses router", () => {
    const router: any = { query: { sort_dir: "DESC", sort: "edition-size" } };
    const { initialSortDir, initialSort } = getInitialRouterValues(router);
    expect(initialSortDir).toBe(SortDirection.DESC);
    expect(initialSort).toBe(MemeLabSort.EDITION_SIZE);
  });

  it("printSortButtons filters options when collection", () => {
    render(
      <div>
        {printSortButtons(
          MemeLabSort.AGE,
          VolumeType.ALL_TIME,
          jest.fn(),
          jest.fn(),
          true
        )}
      </div>
    );
    const buttons = screen.getAllByTestId("sort").map((b) => b.textContent);
    expect(buttons).not.toContain(MemeLabSort.ARTISTS);
    expect(buttons).not.toContain(MemeLabSort.COLLECTIONS);
  });

  it("printNftContent shows different text", () => {
    const nft: LabNFT = {
      id: 1,
      mint_date: "2023",
      artist: "a",
      supply: 10,
      floor_price: 1,
      highest_offer: 0,
      market_cap: 1,
      total_volume: 1,
      total_volume_last_24_hours: 2,
      total_volume_last_7_days: 3,
      total_volume_last_1_month: 4,
    } as any;
    const meta: LabExtendedData = {
      id: 1,
      hodlers: 2,
      percent_unique: 0.5,
      percent_unique_cleaned: 0.4,
    } as any;
    const { container, rerender } = render(
      <div>
        {printNftContent(
          nft,
          MemeLabSort.EDITION_SIZE,
          [meta],
          VolumeType.ALL_TIME
        )}
      </div>
    );
    expect(container.textContent).toContain("Edition Size: 10");
    rerender(
      <div>
        {printNftContent(nft, MemeLabSort.HODLERS, [meta], VolumeType.ALL_TIME)}
      </div>
    );
    expect(container.textContent).toContain("Collectors: 2");
  });

  it("sortChanged sorts and updates router", () => {
    const router = { replace: jest.fn() } as any;
    const nfts: LabNFT[] = [
      { id: 1, supply: 5 } as any,
      { id: 2, supply: 3 } as any,
    ];
    const metas: LabExtendedData[] = [
      { id: 1, hodlers: 1, percent_unique: 0.1, percent_unique_cleaned: 0.1 },
      { id: 2, hodlers: 2, percent_unique: 0.2, percent_unique_cleaned: 0.2 },
    ] as any;
    const setNfts = jest.fn();
    sortChanged(
      router,
      MemeLabSort.AGE,
      SortDirection.ASC,
      VolumeType.ALL_TIME,
      nfts,
      metas,
      undefined,
      setNfts
    );
    expect(router.replace).toHaveBeenCalledWith(
      { query: { sort: MemeLabSort.AGE, sort_dir: SortDirection.ASC } },
      undefined,
      { shallow: true }
    );
    expect(setNfts).toHaveBeenCalledWith([
      { id: 2, supply: 3 },
      { id: 1, supply: 5 },
    ]);
  });
});
