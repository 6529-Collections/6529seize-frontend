import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NFTLeaderboard from '../../../components/leaderboard/NFTLeaderboard';

jest.mock('../../../components/leaderboard/LeaderboardCollector', () => ({ LeaderboardCollector: (p:any) => <div>{p.handle}</div> }));
jest.mock('../../../components/pagination/Pagination', () => (props:any) => <button data-testid="next" onClick={() => props.setPage(props.page + 1)}>next</button>);
jest.mock('../../../components/searchModal/SearchModal', () => ({
  SearchWalletsDisplay: ({ setSearchWallets }:any) => <button data-testid="search" onClick={() => setSearchWallets(['0x1'])}>search</button>,
  SearchModalDisplay: () => null,
}));

jest.mock('react-bootstrap', () => ({ Container:(p:any)=><div>{p.children}</div>, Row:(p:any)=><div>{p.children}</div>, Col:(p:any)=><div>{p.children}</div>, Table:(p:any)=><table>{p.children}</table> }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon:(p:any)=><svg onClick={p.onClick} /> }));

jest.mock('../../../helpers/Helpers', () => ({ numberWithCommas:(n:number)=>String(n), cicToType: ()=>'T' }));

jest.mock('../../../services/api/common-api', () => ({ commonApiFetch: jest.fn() }));
const commonApiFetch = require('../../../services/api/common-api').commonApiFetch as jest.Mock;

describe('NFTLeaderboard component', () => {
  beforeEach(() => {
    commonApiFetch.mockReset();
  });

  it('fetches data and paginates', async () => {
    commonApiFetch.mockResolvedValue({ count:1, data:[{ id:1, cic_score:0, consolidation_key:'1', handle:'alice', consolidation_display:'Alice', pfp_url:'', level:1, balance:1, boosted_tdh:0, tdh__raw:0, tdh_rank:1, total_balance:0, total_boosted_tdh:0, total_tdh__raw:0 }] });
    render(<NFTLeaderboard contract="0x1" nftId={1} />);
    await screen.findByText('alice');
    expect(commonApiFetch).toHaveBeenCalledWith({ endpoint: expect.stringContaining('tdh/nft/0x1/1') });
    await userEvent.click(screen.getByTestId('next'));
    await waitFor(() => expect(commonApiFetch).toHaveBeenLastCalledWith({ endpoint: expect.stringContaining('page=2') }));
  });
});
