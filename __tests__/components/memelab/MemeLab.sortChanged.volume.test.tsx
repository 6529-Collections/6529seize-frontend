import { sortChanged } from "@/components/memelab/MemeLab";
import type { LabNFT} from "@/entities/INFT";
import { VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { MemeLabSort } from "@/enums";

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

describe("sortChanged volume sorting", () => {
  it("sorts nfts by volume desc and updates router", () => {
    const router = { replace: jest.fn() } as any;
    const nfts: LabNFT[] = [
      { id: 1, total_volume_last_7_days: 5 } as any,
      { id: 2, total_volume_last_7_days: 10 } as any,
    ];
    const setNfts = jest.fn();
    sortChanged(
      router,
      MemeLabSort.VOLUME,
      SortDirection.DESC,
      VolumeType.DAYS_7,
      nfts,
      [] as any,
      setNfts
    );
    expect(router.replace).toHaveBeenCalledWith("?sort=volume&sort_dir=desc");
    expect(setNfts).toHaveBeenLastCalledWith([nfts[1], nfts[0]]);
  });
});
