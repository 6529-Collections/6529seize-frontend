import { fetchNftTdhResults, setScrollPosition, PAGE_SIZE } from '../../../components/leaderboard/NFTLeaderboard';
import { commonApiFetch } from '../../../services/api/common-api';
import { cicToType } from '../../../helpers/Helpers';

jest.mock('../../../services/api/common-api');
jest.mock('../../../helpers/Helpers', () => ({ cicToType: jest.fn() }));

describe('fetchNftTdhResults', () => {
  it('fetches results and maps cic_type', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({ count:1, page:1, next:null, data:[{ cic_score: 5 }] });
    (cicToType as jest.Mock).mockReturnValue('TYPE');

    const res = await fetchNftTdhResults('c', 1, '', 2, 'balance', 'DESC');

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `tdh/nft/c/1?&page_size=${PAGE_SIZE}&page=2&sort=balance&sort_direction=DESC`,
    });
    expect(res.data[0].cic_type).toBe('TYPE');
  });
});

describe('setScrollPosition', () => {
  it('scrolls to leaderboard when scrolled down', () => {
    const div = document.createElement('div');
    div.id = 'nft-leaderboard';
    Object.defineProperty(div, 'offsetTop', { value: 50 });
    document.body.appendChild(div);
    const scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
    Object.defineProperty(window, 'scrollY', { value: 10, writable: true });

    setScrollPosition();

    expect(scrollTo).toHaveBeenCalledWith({ top: 50, behavior: 'smooth' });
    scrollTo.mockRestore();
    document.body.innerHTML = '';
  });
});
