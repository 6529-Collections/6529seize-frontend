import { sortChanged } from '../../../components/memelab/MemeLab';
import { MemeLabSort } from '../../../enums';
import { SortDirection } from '../../../entities/ISort';
import { VolumeType, LabNFT, LabExtendedData } from '../../../entities/INFT';

describe('sortChanged unique percent ex museum', () => {
  it('sorts by cleaned unique percent', () => {
    const router = { replace: jest.fn() } as any;
    const nfts: LabNFT[] = [{ id:1 } as any, { id:2 } as any];
    const metas: LabExtendedData[] = [
      { id:1, percent_unique_cleaned:0.2 } as any,
      { id:2, percent_unique_cleaned:0.5 } as any
    ];
    const setNfts = jest.fn();
    sortChanged(
      router,
      MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM,
      SortDirection.DESC,
      VolumeType.ALL_TIME,
      nfts,
      metas,
      undefined,
      setNfts
    );
    expect(router.replace).toHaveBeenCalledWith(
      { query: { sort: 'unique_percent_ex_museum', sort_dir: 'desc' } },
      undefined,
      { shallow: true }
    );
    expect(setNfts).toHaveBeenLastCalledWith([{ id:2 }, { id:1 }]);
  });
});
