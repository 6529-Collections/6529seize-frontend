import {
  getInitialRouterValues,
  printNftContent,
} from "@/components/memelab/MemeLab";
import { LabExtendedData, LabNFT, VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { MemeLabSort } from "@/enums";
import { render } from "@testing-library/react";

describe("MemeLab extra tests", () => {
  it("getInitialRouterValues falls back to defaults when query empty", () => {
    const res = getInitialRouterValues(null, null);
    expect(res.initialSort).toBe(MemeLabSort.AGE);
    expect(res.initialSortDir).toBe(SortDirection.ASC);
  });

  it("printNftContent prints highest offer and market cap", () => {
    const nft: LabNFT = {
      id: 1,
      highest_offer: 1.234,
      market_cap: 2.5,
      floor_price: 0,
      total_volume: 0,
      total_volume_last_24_hours: 0,
      total_volume_last_7_days: 0,
      total_volume_last_1_month: 0,
      artist: "",
      name: "",
      contract: "",
      created_at: new Date(),
      mint_price: 0,
      supply: 0,
      collection: "",
      token_type: "",
      description: "",
      artist_seize_handle: "",
      uri: "",
      icon: "",
      thumbnail: "",
      scaled: "",
      image: "",
      animation: "",
      meme_references: [],
    };
    const meta: LabExtendedData = {
      id: 1,
      hodlers: 0,
      percent_unique: 0,
      percent_unique_cleaned: 0,
    } as any;
    const { container, rerender } = render(
      <div>
        {printNftContent(
          nft,
          MemeLabSort.HIGHEST_OFFER,
          [meta],
          VolumeType.ALL_TIME
        )}
      </div>
    );
    expect(container.textContent).toContain("Highest Offer");
    rerender(
      <div>
        {printNftContent(
          nft,
          MemeLabSort.MARKET_CAP,
          [meta],
          VolumeType.ALL_TIME
        )}
      </div>
    );
    expect(container.textContent).toContain("Market Cap");
  });
});
