import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import NextgenTokenAbout from '../../../../../components/nextGen/collections/nextgenToken/NextGenTokenAbout';

jest.mock('react-bootstrap', () => {
  const React = require('react');
  return { Container:(p:any)=><div {...p}/>, Row:(p:any)=><div {...p}/>, Col:(p:any)=><div {...p}/> };
});
jest.mock('next/image', () => (props: any) => <img {...props} />);
jest.mock('@tippyjs/react', () => (props: any) => <span>{props.children}</span>);
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (p:any)=> <svg data-testid={p.icon?.iconName || 'icon'} /> }));
jest.mock('../../../../../helpers/Helpers', () => ({
  areEqualAddresses: jest.fn(() => true),
  isNullAddress: jest.fn(() => false),
  formatAddress: (a:string)=>a,
  numberWithCommas: (n:number)=>String(n),
  printMintDate: ()=> 'date',
  cicToType: jest.fn(()=> 'REP'),
  getRoyaltyImage: jest.fn(()=> 'r.png'),
}));
jest.mock('../../../../../services/api/common-api', () => ({ commonApiFetch: jest.fn(() => Promise.resolve({ data:[{boosted_tdh:5}] })) }));
jest.mock('../../../../../hooks/useCapacitor', () => ({ __esModule:true, default: () => ({ isIos:false }) }));
jest.mock('../../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: () => ({ address:'0x1' }) }));
jest.mock('../../../../../hooks/useIdentity', () => ({ useIdentity: () => ({ profile:{ level:1, cic:'REP', handle:'me', tdh:2 } }) }));
jest.mock('../../../../../components/cookies/CookieConsentContext', () => ({ useCookieConsent: () => ({ country:'US' }) }));
jest.mock('../../../../../components/user/utils/icons/EthereumIcon', () => () => <span data-testid="eth"/>);

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
});

