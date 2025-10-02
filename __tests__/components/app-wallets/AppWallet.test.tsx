import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppWallet from '@/components/app-wallets/AppWallet';
import { useAppWallets } from '@/components/app-wallets/AppWalletsContext';
import { useAuth } from '@/components/auth/Auth';
import { useSeizeConnectContext } from '@/components/auth/SeizeConnectContext';
import { useRouter } from 'next/navigation';
import { useBalance, useChainId } from 'wagmi';
import { sepolia } from 'viem/chains';

jest.mock('next/image', () => ({ __esModule: true, default: (p:any)=> <img {...p}/> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({href, children}:any)=> <a href={href}>{children}</a> }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/components/app-wallets/AppWalletsContext');
jest.mock('@/components/auth/Auth');
jest.mock('@/components/auth/SeizeConnectContext');
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: (props:any)=> <svg data-testid="icon" onClick={props.onClick} data-tooltip-id={props['data-tooltip-id']}/> }));
jest.mock('@/components/app-wallets/AppWalletAvatar', () => ({__esModule:true,default: ({address}:any)=><div data-testid="avatar">{address}</div>}));
jest.mock('@/components/app-wallets/AppWalletsUnsupported', () => () => <div data-testid="unsupported"/>);
jest.mock('@/components/dotLoader/DotLoader', () => ({__esModule:true,default: ()=> <span data-testid="dotloader"/>, Spinner: ()=> <span data-testid="spinner"/> }));
jest.mock('@/components/app-wallets/AppWalletModal', () => ({ UnlockAppWalletModal: () => null }));
jest.mock('@/components/app-wallets/app-wallet-helpers', () => ({ decryptData: jest.fn(()=>Promise.resolve('decrypted')) }));
jest.mock('wagmi', () => ({ useBalance: jest.fn(), useChainId: jest.fn() }));
jest.mock('react-tooltip', () => ({
  Tooltip: ({ children, id }: any) => (
    <div data-testid={`tooltip-${id}`}>
      {children}
    </div>
  ),
}));

const mockedUseAppWallets = useAppWallets as jest.Mock;
const mockedUseAuth = useAuth as jest.Mock;
const mockedUseSeize = useSeizeConnectContext as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUseBalance = useBalance as jest.Mock;
const mockedUseChainId = useChainId as jest.Mock;

const wallet = {
  name: 'Test',
  created_at: 0,
  address: '0xABC',
  address_hashed: 'hash',
  mnemonic: 'na',
  private_key: 'pk',
  imported: false
};

beforeEach(()=>{
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push: jest.fn() });
  mockedUseBalance.mockReturnValue({ isFetching:false, data:{ value: BigInt('1000000000000000000'), symbol:'ETH' }});
  mockedUseChainId.mockReturnValue(sepolia.id);
  mockedUseAuth.mockReturnValue({ setToast: jest.fn() });
  mockedUseSeize.mockReturnValue({ address: '0xDEF' });
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
});

function renderComponent(ctx:any){
  mockedUseAppWallets.mockReturnValue(ctx);
  return render(<AppWallet address="0xABC"/>);
}

describe('AppWallet', () => {
  it('shows spinner when fetching', () => {
    renderComponent({fetchingAppWallets:true, appWalletsSupported:true, appWallets:[], deleteAppWallet:jest.fn()});
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('shows unsupported when not supported', () => {
    renderComponent({fetchingAppWallets:false, appWalletsSupported:false, appWallets:[], deleteAppWallet:jest.fn()});
    expect(screen.getByTestId('unsupported')).toBeInTheDocument();
  });

  it('shows not found when wallet missing', () => {
    renderComponent({fetchingAppWallets:false, appWalletsSupported:true, appWallets:[], deleteAppWallet:jest.fn()});
    expect(screen.getByText(/Wallet with address/i)).toBeInTheDocument();
  });

  it('prevents deleting connected wallet', async () => {
    const deleteMock = jest.fn();
    const toast = jest.fn();
    mockedUseAuth.mockReturnValue({ setToast: toast });
    mockedUseSeize.mockReturnValue({ address: '0xABC' });
    const confirmSpy = jest.spyOn(window, 'confirm');
    renderComponent({fetchingAppWallets:false, appWalletsSupported:true, appWallets:[wallet], deleteAppWallet:deleteMock});
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('deletes wallet on confirm', async () => {
    const deleteMock = jest.fn().mockResolvedValue(true);
    const toast = jest.fn();
    const push = jest.fn();
    mockedUseAuth.mockReturnValue({ setToast: toast });
    mockedUseRouter.mockReturnValue({ push });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    renderComponent({fetchingAppWallets:false, appWalletsSupported:true, appWallets:[wallet], deleteAppWallet:deleteMock});
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(deleteMock).toHaveBeenCalledWith('0xABC');
    expect(push).toHaveBeenCalledWith('/tools/app-wallets');
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    confirmSpy.mockRestore();
  });

  it('prints balance correctly', () => {
    renderComponent({fetchingAppWallets:false, appWalletsSupported:true, appWallets:[wallet], deleteAppWallet:jest.fn()});
    expect(screen.getByText(/1\s*ETH/)).toBeInTheDocument();
    expect(screen.getByText(/sepolia/)).toBeInTheDocument();
  });

  it('copies wallet address to clipboard', async () => {
    const { container } = renderComponent({fetchingAppWallets:false, appWalletsSupported:true, appWallets:[wallet], deleteAppWallet:jest.fn()});
    // Find the icon that has the copy address tooltip
    const copyIcon = container.querySelector('[data-tooltip-id="copy-address-0xABC"]');
    expect(copyIcon).toBeTruthy();
    await userEvent.click(copyIcon as HTMLElement);
    expect((navigator.clipboard.writeText as jest.Mock)).toHaveBeenCalledWith('0xABC');
  });
});
