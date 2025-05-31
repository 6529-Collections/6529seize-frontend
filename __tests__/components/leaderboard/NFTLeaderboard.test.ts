import { fetchNftTdhResults, setScrollPosition, PAGE_SIZE } from '../../../components/leaderboard/NFTLeaderboard';
import { cicToType } from '../../../helpers/Helpers';
import { commonApiFetch } from '../../../services/api/common-api';

jest.mock('../../../helpers/Helpers', () => {
  const original = jest.requireActual('../../../helpers/Helpers');
  return { ...original, cicToType: jest.fn() };
});

jest.mock('../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
}));

describe('fetchNftTdhResults', () => {
  it('fetches data and converts cic_type', async () => {
    (commonApiFetch as jest.Mock).mockResolvedValue({
      count: 1,
      page: 1,
      next: null,
      data: [
        { id: 1, cic_score: 10 },
      ],
    });
    (cicToType as jest.Mock).mockReturnValue('VIP');

    const result = await fetchNftTdhResults('0xabc', 5, '', 2, 'balance', 'ASC');

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `tdh/nft/0xabc/5?&page_size=${PAGE_SIZE}&page=2&sort=balance&sort_direction=ASC`,
    });
    expect(result.data[0].cic_type).toBe('VIP');
  });
});

describe('setScrollPosition', () => {
  it('scrolls to leaderboard when scrolled', () => {
    const div = document.createElement('div');
    div.id = 'nft-leaderboard';
    Object.defineProperty(div, 'offsetTop', { value: 100 });
    document.body.appendChild(div);
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation();

    setScrollPosition();

    expect(scrollSpy).toHaveBeenCalledWith({ top: 100, behavior: 'smooth' });

    scrollSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('does nothing when not scrolled', () => {
    const div = document.createElement('div');
    div.id = 'nft-leaderboard';
    Object.defineProperty(div, 'offsetTop', { value: 50 });
    document.body.appendChild(div);
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    const scrollSpy = jest.spyOn(window, 'scrollTo').mockImplementation();

    setScrollPosition();

    expect(scrollSpy).not.toHaveBeenCalled();

    scrollSpy.mockRestore();
    document.body.innerHTML = '';
  });
});
