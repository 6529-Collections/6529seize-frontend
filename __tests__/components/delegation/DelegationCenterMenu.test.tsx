import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props}/> }));

jest.mock('../../../components/delegation/DelegationCenter', () => () => <div data-testid="center"/>);
jest.mock('../../../components/delegation/walletChecker/WalletChecker', () => () => <div/>);
jest.mock('../../../components/delegation/NewDelegation', () => () => <div/>);
jest.mock('../../../components/delegation/NewSubDelegation', () => () => <div/>);
jest.mock('../../../components/delegation/NewConsolidation', () => () => <div/>);
jest.mock('../../../components/delegation/NewAssignPrimaryAddress', () => () => <div/>);
jest.mock('../../../components/delegation/CollectionDelegation', () => () => <div/>);
jest.mock('../../../components/delegation/html/DelegationHTML', () => () => <div/>);

jest.mock('../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: () => ({ address: '0xabc' })
}));

jest.mock('wagmi', () => ({ useEnsName: () => ({ data: 'ens' }) }));
jest.mock('next/router', () => ({ useRouter: () => ({ asPath: '/delegation' }) }));

const props = {
  section: require('../../../components/delegation/DelegationCenterMenu').DelegationCenterSection.CENTER,
  path: [],
  setActiveSection: jest.fn(),
  address_query: '',
  setAddressQuery: jest.fn(),
  collection_query: '',
  setCollectionQuery: jest.fn(),
  use_case_query: 0,
  setUseCaseQuery: jest.fn(),
};


describe('DelegationCenterMenu links', () => {
  it('renders resource links', async () => {
    const mod = await import('../../../components/delegation/DelegationCenterMenu');
    const DelegationCenterMenu = mod.default;
    render(<DelegationCenterMenu {...props} />);
    const nftLink = screen.getAllByText('NFTDelegation.com')[0].closest('a');
    expect(nftLink).toHaveAttribute('href', 'https://nftdelegation.com/');
    const etherscan = screen.getAllByText('Etherscan')[0].closest('a') as HTMLAnchorElement;
    expect(etherscan?.href).toContain('etherscan.io/address');
    const github = screen.getAllByText('Github')[0].closest('a');
    expect(github).toHaveAttribute('href', 'https://github.com/6529-Collections/nftdelegation');
  });

  it('changes section on wallet checker click', async () => {
    const mod = await import('../../../components/delegation/DelegationCenterMenu');
    const DelegationCenterMenu = mod.default;
    render(<DelegationCenterMenu {...props} />);
    fireEvent.click(screen.getAllByText('Wallet Checker')[0]);
    expect(props.setActiveSection).toHaveBeenCalledWith(mod.DelegationCenterSection.CHECKER);
  });
});

describe('DelegationToast', () => {
  it('closes when clicking outside or close button', () => {
    const { DelegationToast } = require('../../../components/delegation/DelegationCenterMenu');
    const setShow = jest.fn();
    const ref = React.createRef<HTMLDivElement>();
    const { container } = render(
      <DelegationToast toastRef={ref} toast={{ title: 't' }} showToast={true} setShowToast={setShow} />
    );
    fireEvent.click(container.firstChild!);
    expect(setShow).toHaveBeenCalledWith(false);
    setShow.mockClear();
    const btn = container.querySelector('button');
    if (btn) {
      fireEvent.click(btn);
      expect(setShow).toHaveBeenCalledWith(false);
    }
  });
});
