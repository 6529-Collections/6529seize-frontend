import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import NextGenAdmin, { printAdminErrors } from '@/components/nextGen/admin/NextGenAdmin';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSeizeConnectContext } from '@/components/auth/SeizeConnectContext';
import * as helpers from '@/components/nextGen/nextgen_helpers';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));
jest.mock('@/components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('@/contexts/TitleContext', () => ({ useSetTitle: jest.fn() }));

jest.mock('@/components/nextGen/admin/NextGenAdminSetData', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminSetCosts', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminSetPhases', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminRegisterAdmin', () => ({ __esModule: true, default: () => <div />, ADMIN_TYPE: {} }));
jest.mock('@/components/nextGen/admin/NextGenAdminArtistSignCollection', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminAirdropTokens', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminProposeAddressesAndPercentages', () => ({ __esModule: true, default: () => <div />, ProposalType: {} }));
jest.mock('@/components/nextGen/admin/NextGenAdminSetSplits', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminChangeMetadataView', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminUpdateImagesAttributes', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminAddRandomizer', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminSetFinalSupply', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminInitializeBurn', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminAcceptAddressesAndPercentages', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminPayArtist', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminMintAndAuction', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminInitializeExternalBurnSwap', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminCreateCollection', () => ({ __esModule: true, default: () => <div /> }));
jest.mock('@/components/nextGen/admin/NextGenAdminUpdateCollection', () => ({ __esModule: true, default: () => <div />, UpdateType: {} }));
jest.mock('@/components/nextGen/admin/NextGenAdminUploadAL', () => ({ __esModule: true, default: () => <div /> }));

jest.mock('@/components/header/user/HeaderUserConnect', () => () => <div data-testid="connect" />);

const routerMock = { push: jest.fn() };
(useRouter as jest.Mock).mockReturnValue(routerMock);
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
(useSeizeConnectContext as jest.Mock).mockReturnValue({ isConnected: false });

jest.spyOn(helpers, 'useGlobalAdmin').mockReturnValue({ data: false } as any);
jest.spyOn(helpers, 'useFunctionAdmin').mockReturnValue({ data: false } as any);
jest.spyOn(helpers, 'useCollectionIndex').mockReturnValue('1' as any);
jest.spyOn(helpers, 'useCollectionAdmin').mockReturnValue({ data: [] } as any);
jest.spyOn(helpers, 'isCollectionAdmin').mockReturnValue(false as any);
jest.spyOn(helpers, 'isCollectionArtist').mockReturnValue(false as any);
jest.spyOn(helpers, 'useCollectionArtist').mockReturnValue([] as any);
jest.spyOn(helpers, 'useParsedCollectionIndex').mockReturnValue('1' as any);

describe('printAdminErrors', () => {
  it('renders all errors', () => {
    const { container } = render(printAdminErrors(['a', 'b']));
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByText('a')).toBeInTheDocument();
  });
});

describe('NextGenAdmin component', () => {
  beforeEach(() => {
    routerMock.push.mockClear();
  });

  it('shows connect prompt when not connected', () => {
    render(<NextGenAdmin />);
    expect(screen.getByTestId('connect')).toBeInTheDocument();
  });

  it('updates focus and pushes router', async () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ isConnected: true, address: '0x1' });
    (helpers.useGlobalAdmin as jest.Mock).mockReturnValue({ data: true });

    render(<NextGenAdmin />);
    expect(screen.getByText('REGISTER / REVOKE ADMINS')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Collection'));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('?focus=collection')
    );
  });
});
