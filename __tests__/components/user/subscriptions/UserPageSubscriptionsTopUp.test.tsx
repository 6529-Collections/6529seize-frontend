import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { parseEther } from 'viem';
import UserPageSubscriptionsTopUp from '../../../../components/user/subscriptions/UserPageSubscriptionsTopUp';
import { SUBSCRIPTIONS_CHAIN, SUBSCRIPTIONS_ADDRESS, MEMES_MINT_PRICE } from '../../../../constants';

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

jest.mock('../../../../helpers/meme_calendar.helpers', () => ({
  numberOfCardsForCalendarEnd: () => ({ count: 0, year: 2024 }),
  numberOfCardsForSeasonEnd: () => ({ count: 0, szn: 1 }),
}));

jest.mock('../../../../components/dotLoader/DotLoader', () => () => <span data-testid="loader" />);
jest.mock('../../../../components/cookies/CookieConsentContext', () => ({ 
  useCookieConsent: jest.fn(() => ({
    showCookieConsent: false,
    country: 'US',
    consent: jest.fn(),
    reject: jest.fn()
  }))
}));

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: (props: any) => <span>{props.children}</span> }));

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
