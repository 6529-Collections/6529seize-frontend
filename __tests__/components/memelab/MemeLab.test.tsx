import { render, screen } from '@testing-library/react';
import { getInitialRouterValues, printSortButtons, printNftContent, sortChanged } from '../../../components/memelab/MemeLab';
import { MemeLabSort } from '../../../enums';
import { SortDirection } from '../../../entities/ISort';
import { VolumeType, LabNFT, LabExtendedData } from '../../../entities/INFT';
import React from 'react';

jest.mock('../../../components/the-memes/TheMemes', () => ({
  printVolumeTypeDropdown: () => <div>volume</div>,
  SortButton: ({ sort, select }: any) => <button onClick={select}>{sort}</button>
}));

describe('MemeLab helpers', () => {
  it('gets initial router values', () => {
    const router: any = { query: { sort: 'volume', sort_dir: "DESC" } };
    const { initialSort, initialSortDir } = getInitialRouterValues(router);
    expect(initialSort).toBe(MemeLabSort.VOLUME);
    expect(initialSortDir).toBe(SortDirection.DESC);
  });

  it('prints sort buttons', () => {
    render(<div>{printSortButtons(MemeLabSort.AGE, jest.fn(), jest.fn())}</div>);
    expect(screen.getByText(MemeLabSort.EDITION_SIZE)).toBeInTheDocument();
    expect(screen.getByText('volume')).toBeInTheDocument();
  });

  it('prints nft content', () => {
    const nft: LabNFT = { id: 1, mint_date: new Date('2020-01-01'), artist: 'Bob', supply: 1, hodlers: 0, percent_unique: 0, percent_unique_cleaned: 0, floor_price: 0, market_cap: 0, highest_offer: 0, total_volume_last_24_hours: 2, total_volume_last_7_days: 2, total_volume_last_1_month: 2, total_volume: 2 } as any;
    const meta: LabExtendedData = { id: 1, hodlers: 1, percent_unique: 0.5, percent_unique_cleaned: 0.4 } as any;
    render(<div>{printNftContent(nft, MemeLabSort.HODLERS, [meta], VolumeType.ALL_TIME)}</div>);
    expect(screen.getByText('Collectors: 1')).toBeInTheDocument();
  });

  it('sortChanged sorts age desc', () => {
    const router: any = { replace: jest.fn(), query: {} };
    const nfts = [{ id:1 }, { id:2 }] as any[];
    sortChanged(router, MemeLabSort.AGE, SortDirection.DESC, VolumeType.ALL_TIME, nfts, [], undefined, (v) => nfts.splice(0,nfts.length,...v));
    expect(nfts[0].id).toBe(1);
    expect(router.replace).toHaveBeenCalled();
  });
});
