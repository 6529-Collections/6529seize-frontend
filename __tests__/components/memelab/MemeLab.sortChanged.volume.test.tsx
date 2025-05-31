import { sortChanged } from '../../../components/memelab/MemeLab';
import { MemeLabSort } from '../../../enums';
import { SortDirection } from '../../../entities/ISort';
import { VolumeType, LabNFT } from '../../../entities/INFT';

describe('sortChanged volume sorting', () => {
  it('sorts nfts by volume desc and updates router', () => {
    const router = { replace: jest.fn() } as any;
    const nfts: LabNFT[] = [
      { id:1, total_volume_last_7_days:5 } as any,
      { id:2, total_volume_last_7_days:10 } as any
    ];
    const setNfts = jest.fn();
    sortChanged(router, MemeLabSort.VOLUME, SortDirection.DESC, VolumeType.DAYS_7, nfts, [] as any, undefined, setNfts);
    expect(router.replace).toHaveBeenCalledWith({ query: { sort: MemeLabSort.VOLUME, sort_dir: SortDirection.DESC } }, undefined, { shallow: true });
    expect(setNfts).toHaveBeenLastCalledWith([nfts[1], nfts[0]]);
  });
});
