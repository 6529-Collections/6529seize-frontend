import { sortChanged } from "@/components/memelab/MemeLab";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { MemeLabSort } from "@/types/enums";

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

describe("sortChanged unique percent ex museum", () => {
  it("sorts by cleaned unique percent", () => {
    const router = { replace: jest.fn() } as any;
    const nfts: LabNFT[] = [{ id: 1 } as any, { id: 2 } as any];
    const metas: LabExtendedData[] = [
      { id: 1, percent_unique_cleaned: 0.2 } as any,
      { id: 2, percent_unique_cleaned: 0.5 } as any,
    ];
    const setNfts = jest.fn();
    sortChanged(
      router,
      MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM,
      SortDirection.DESC,
      VolumeType.ALL_TIME,
      nfts,
      metas,
      setNfts
    );
    expect(router.replace).toHaveBeenCalledWith(
      "?sort=unique_percent_ex_museum&sort_dir=desc"
    );
    expect(setNfts).toHaveBeenLastCalledWith([{ id: 2 }, { id: 1 }]);
  });
});
