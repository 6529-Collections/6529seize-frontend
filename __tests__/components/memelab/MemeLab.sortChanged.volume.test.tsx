import { sortChanged } from "@/components/memelab/MemeLab";
import { LabNFT, VolumeType } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { MemeLabSort } from "@/enums";

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
