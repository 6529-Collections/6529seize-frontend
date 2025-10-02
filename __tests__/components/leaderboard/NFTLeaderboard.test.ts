import { fetchNftTdhResults, setScrollPosition, PAGE_SIZE } from '@/components/leaderboard/NFTLeaderboard';
import { cicToType } from '@/helpers/Helpers';
import { commonApiFetch } from '@/services/api/common-api';

jest.mock('@/services/api/common-api');
jest.mock('@/helpers/Helpers', () => ({
  cicToType: jest.fn().mockReturnValue('TYPE')
}));

describe('fetchNftTdhResults', () => {
  it('fetches data and converts cic type', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ count:1, page:1, next:null, data:[{ id:1, cic_score:10 }] });
    const result = await fetchNftTdhResults('0x', 1, '', 2, 'balance', 'ASC');
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: `tdh/nft/0x/1?&page_size=${PAGE_SIZE}&page=2&sort=balance&sort_direction=ASC` });
    expect(cicToType).toHaveBeenCalledWith(10);
    expect(result.data[0]).toHaveProperty('cic_type', 'TYPE');
  });
});

describe('setScrollPosition', () => {
  it('scrolls when needed', () => {
    document.body.innerHTML = '<div id="nft-leaderboard" style="height:10px"></div>';
    const elem = document.getElementById('nft-leaderboard') as HTMLElement;
    Object.defineProperty(elem, 'offsetTop', { value: 50 });
    Object.defineProperty(window, 'scrollY', { value: 5, writable: true });
    const spy = jest.spyOn(window, 'scrollTo').mockImplementation();
    setScrollPosition();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not scroll when already at top', () => {
    document.body.innerHTML = '<div id="nft-leaderboard"></div>';
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    const spy = jest.spyOn(window, 'scrollTo').mockImplementation();
    setScrollPosition();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('fetchNftTdhResults multiple entries', () => {
  it('converts cic_type for each entry', async () => {
    (cicToType as jest.Mock).mockClear();
    (commonApiFetch as jest.Mock).mockResolvedValue({
      count: 2,
      page: 1,
      next: null,
      data: [ { id: 1, cic_score: 1 }, { id: 2, cic_score: 2 } ],
    });
    (cicToType as jest.Mock).mockImplementation((score) => `T${score}`);

    const result = await fetchNftTdhResults('0xdef', 1, '', 1, 'balance', 'DESC');
    expect(cicToType).toHaveBeenCalledTimes(2);
    expect(result.data[0].cic_type).toBe('T1');
    expect(result.data[1].cic_type).toBe('T2');
  });
});

describe('setScrollPosition', () => {
  it('handles missing element gracefully', () => {
    document.body.innerHTML = '';
    const spy = jest.spyOn(window, 'scrollTo').mockImplementation();
    setScrollPosition();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('fetchNftTdhResults wallet filter', () => {
  it('adds search param when wallets provided', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ count:0, page:1, next:null, data:[] });
    await fetchNftTdhResults('0xabc', 2, '&search=0x1', 1, 'balance', 'ASC');
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: `tdh/nft/0xabc/2?&search=0x1&page_size=${PAGE_SIZE}&page=1&sort=balance&sort_direction=ASC` });
  });
});
