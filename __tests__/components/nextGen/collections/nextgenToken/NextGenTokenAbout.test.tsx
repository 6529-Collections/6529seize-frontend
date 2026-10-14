import { render, screen, waitFor } from '@testing-library/react';
import NextgenTokenAbout from '@/components/nextGen/collections/nextgenToken/NextGenTokenAbout';
import { renderServerThenHydrate } from '@/__tests__/utils/timeZoneHydration';

jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any)=> <svg data-testid={p.icon?.iconName || 'icon'} /> }));
jest.mock('@/helpers/Helpers', () => ({
  areEqualAddresses: jest.fn(() => true),
  isNullAddress: jest.fn(() => false),
  formatAddress: (a:string)=>a,
  numberWithCommas: (n:number)=>String(n),
  printMintDate: jest.requireActual('@/helpers/Helpers').printMintDate,
  cicToType: jest.fn(()=> 'REP'),
  getRoyaltyImage: jest.fn(()=> 'r.png'),
}));
jest.mock('@/services/api/common-api', () => ({ commonApiFetch: jest.fn(() => Promise.resolve({ data:[{boosted_tdh:5}] })) }));
jest.mock('@/hooks/useCapacitor', () => ({ __esModule:true, default: () => ({ isIos:false }) }));
jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address:'0x1' }) }));
jest.mock('@/hooks/useIdentity', () => ({ useIdentity: () => ({ profile:{ level:1, cic:'REP', handle:'me', tdh:2 } }) }));
jest.mock('@/components/cookies/CookieConsentContext', () => ({ useCookieConsent: () => ({ country:'US' }) }));
jest.mock('@/components/user/utils/icons/EthereumIcon', () => () => <span data-testid="eth"/>);

const token:any = { id:1, normalised_id:1, mint_date:0, mint_price:1, owner:'0x1', burnt:true,
  opensea_price:0, opensea_royalty:0, blur_price:0, me_price:0, me_royalty:0, hodl_rate:1 };
const collection:any = { name:'COL', artist:'ART', artist_address:'0xA', licence:'CC0' };

describe('NextGenTokenAbout', () => {
  it('renders basic info and burnt icon', async () => {
    render(<NextgenTokenAbout token={token} collection={collection} />);
    expect(screen.getByText('Collection Token ID:')).toBeInTheDocument();
    expect(screen.getByTestId('fire')).toBeInTheDocument();
    await waitFor(() => screen.getByText('5'));
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hydrates the server mint date unchanged for an Auckland viewer', async () => {
    // 11:27 UTC on Oct 12 is already Oct 13 in Auckland; the mint day is Oct 12.
    const result = await renderServerThenHydrate(
      <NextgenTokenAbout
        token={{ ...token, mint_date: new Date('2026-10-12T11:27:11.000Z') }}
        collection={collection}
      />,
      { serverTimeZone: 'UTC', clientTimeZone: 'Pacific/Auckland' }
    );
    try {
      expect(result.serverHtml).toContain('Oct 12, 2026');
      expect(result.recoverableErrors).toEqual([]);
      expect(result.hydrationConsoleErrors).toEqual([]);
      expect(result.container).toHaveTextContent('Oct 12, 2026');
    } finally {
      await result.cleanup();
    }
  });

  it("keeps collecting actions in the parent market section", async () => {
    render(<NextgenTokenAbout token={token} collection={{ ...collection, id: 1 }} />);
    expect(screen.queryByRole("link", { name: "Collect this artwork" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("5")).toBeInTheDocument());
  });
});
