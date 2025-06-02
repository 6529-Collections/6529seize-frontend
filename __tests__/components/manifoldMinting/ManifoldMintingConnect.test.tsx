import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManifoldMintingConnect from '../../../components/manifoldMinting/ManifoldMintingConnect';
import { AuthContext } from '../../../components/auth/Auth';
import { useSeizeConnectContext } from '../../../components/auth/SeizeConnectContext';
import { CookieConsentProvider } from '../../../components/cookies/CookieConsentContext';

jest.mock('../../../components/header/user/HeaderUserConnect', () => () => <div data-testid="header-connect" />);

jest.mock('react-bootstrap', () => {
  const React = require('react');
  const Form: any = (p: any) => <form {...p}>{p.children}</form>;
  Form.Control = (p: any) => <input data-testid="mint-input" {...p} />;
  return {
    Container: (p: any) => <div data-testid="container" {...p} />,
    Row: (p: any) => <div data-testid="row" {...p} />,
    Col: (p: any) => <div data-testid="col" {...p} />,
    Form,
  };
});

jest.mock('../../../components/user/utils/UserCICAndLevel', () => ({
  __esModule: true,
  default: () => <div data-testid="user-cic" />,
  UserCICAndLevelSize: { XLARGE: 'XLARGE' },
}));

jest.mock('wagmi', () => ({
  useEnsName: () => ({ data: undefined, isFetched: false }),
  useEnsAddress: () => ({ data: undefined, isFetched: false }),
}));

jest.mock('../../../components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(),
}));

const { useSeizeConnectContext: mockedConnect } = require('../../../components/auth/SeizeConnectContext');

function renderConnected(onMintFor = jest.fn()) {
  const seizeCtx = { address: '0xabc000000000000000000000000000000000abcd', isConnected: true };
  (mockedConnect as jest.Mock).mockReturnValue(seizeCtx);
  const auth = { connectedProfile: { handle: 'bob', display: 'bob', level: 1, cic: 1 } } as any;
  render(
    <CookieConsentProvider>
      <AuthContext.Provider value={auth}>
        <ManifoldMintingConnect onMintFor={onMintFor} />
      </AuthContext.Provider>
    </CookieConsentProvider>
  );
  return { onMintFor, seizeCtx };
}


describe('ManifoldMintingConnect', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows connect prompt when not connected', () => {
    (mockedConnect as jest.Mock).mockReturnValue({ isConnected: false });
    render(
      <CookieConsentProvider>
        <ManifoldMintingConnect onMintFor={jest.fn()} />
      </CookieConsentProvider>
    );
    expect(screen.getByTestId('header-connect')).toBeInTheDocument();
  });

  it('calls onMintFor with account address on mount', () => {
    const { onMintFor, seizeCtx } = renderConnected();
    expect(onMintFor).toHaveBeenCalledWith(seizeCtx.address);
  });

  it('allows minting for fren when valid address entered', async () => {
    const { onMintFor } = renderConnected();
    await userEvent.click(screen.getByRole('button', { name: /Mint for fren/i }));
    const input = screen.getByTestId('mint-input');
    const frenAddress = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    await userEvent.type(input, frenAddress);
    await waitFor(() => expect(onMintFor).toHaveBeenLastCalledWith(frenAddress));
    expect(screen.queryByText('Invalid Address')).not.toBeInTheDocument();
  });

  it('shows validation message for invalid address', async () => {
    const { onMintFor } = renderConnected();
    await userEvent.click(screen.getByRole('button', { name: /Mint for fren/i }));
    const input = screen.getByTestId('mint-input');
    await userEvent.type(input, 'notanaddress');
    expect(screen.getByText('Invalid Address')).toBeInTheDocument();
    expect(onMintFor).toHaveBeenCalledTimes(2);
    expect(onMintFor).toHaveBeenLastCalledWith('');
  });
});

