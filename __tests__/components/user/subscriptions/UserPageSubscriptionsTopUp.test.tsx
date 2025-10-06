import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseEther } from 'viem';
import UserPageSubscriptionsTopUp from '@/components/user/subscriptions/UserPageSubscriptionsTopUp';
import { SUBSCRIPTIONS_CHAIN, SUBSCRIPTIONS_ADDRESS, MEMES_MINT_PRICE } from '@/constants';

const sendTransaction = {
  data: undefined,
  sendTransaction: jest.fn(),
  reset: jest.fn(),
  isPending: false,
  error: undefined,
};
const waitSendTransaction = {
  isLoading: false,
  isSuccess: false,
};

jest.mock('wagmi', () => ({
  useSendTransaction: () => sendTransaction,
  useWaitForTransactionReceipt: () => waitSendTransaction,
}));

jest.mock('@/components/meme-calendar/meme-calendar.helpers', () => ({
  __esModule: true,
  displayedEonNumberFromIndex: jest.fn(() => 1),
  displayedEpochNumberFromIndex: jest.fn(() => 1),
  displayedEraNumberFromIndex: jest.fn(() => 1),
  displayedPeriodNumberFromIndex: jest.fn(() => 1),
  displayedSeasonNumberFromIndex: jest.fn(() => 1),
  displayedYearNumberFromIndex: jest.fn(() => 2024),
  getCardsRemainingUntilEndOf: jest.fn(() => 0),
  getSeasonIndexForDate: jest.fn(() => 0),
  nextMintDateOnOrAfter: jest.fn(() => new Date('2024-01-01T00:00:00Z')),
}));

jest.mock('@/components/auth/SeizeConnectContext', () => ({
  useSeizeConnectContext: jest.fn(() => ({ isConnected: true })),
}));

jest.mock('@/components/dotLoader/DotLoader', () => () => <span data-testid="loader" />);
jest.mock('@/components/cookies/CookieConsentContext', () => ({ 
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: 'US',
    consent: jest.fn(),
    reject: jest.fn()
  }))
}));


describe('UserPageSubscriptionsTopUp', () => {
  it('sends transaction on card button click', async () => {
    render(<UserPageSubscriptionsTopUp />);
    await userEvent.click(screen.getByRole('button', { name: /Send top up for 1 Card/i }));
    expect(sendTransaction.sendTransaction).toHaveBeenCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther((MEMES_MINT_PRICE).toString()),
    });
  });

  it('shows success message when transaction succeeded', () => {
    sendTransaction.data = '0x123' as any;
    waitSendTransaction.isSuccess = true;
    const { container } = render(<UserPageSubscriptionsTopUp />);
    expect(container.textContent).toContain('Top Up Successful!');
  });

  it('submits custom count', async () => {
    const user = userEvent.setup();
    render(<UserPageSubscriptionsTopUp />);
    await user.type(screen.getByPlaceholderText('count'), '2');
    await user.click(screen.getByRole('button', { name: 'Send custom top up' }));
    expect(sendTransaction.sendTransaction).toHaveBeenLastCalledWith({
      chainId: SUBSCRIPTIONS_CHAIN.id,
      to: SUBSCRIPTIONS_ADDRESS,
      value: parseEther((2 * MEMES_MINT_PRICE).toString()),
    });
  });
});
