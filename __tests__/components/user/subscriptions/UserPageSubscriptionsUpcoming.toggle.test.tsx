import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery } from '@tanstack/react-query';
import UserPageSubscriptionsUpcoming from '@/components/user/subscriptions/UserPageSubscriptionsUpcoming';
import { AuthContext } from '@/components/auth/Auth';
import { createMockAuthContext } from '@/__tests__/utils/testContexts';

jest.mock('react-toggle', () => (props: any) => (
  <input data-testid="toggle" type="checkbox" onChange={props.onChange} />
));

jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));

const mockUpcomingRows = [
  {
    utcDay: new Date('2024-01-01T00:00:00Z'),
    instantUtc: new Date('2024-01-01T15:40:00Z'),
    meme: 201,
  },
];

jest.mock('@/components/meme-calendar/meme-calendar.helpers', () => ({
  __esModule: true,
  formatFullDate: jest.fn(() => '2024-01-01 / Monday'),
  getUpcomingMintsForCurrentOrNextSeason: jest.fn(() => ({ rows: mockUpcomingRows })),
  isMintingToday: jest.fn(() => false),
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const { commonApiPost } = require('@/services/api/common-api');

const sub = { token_id:1, contract:'0x123', subscribed:true } as any;
const details = { profile:'test' } as any;

const useQueryMock = useQuery as jest.Mock;

function renderComp() {
  useQueryMock.mockReturnValue({ data: null });
  const auth = createMockAuthContext({ requestAuth: jest.fn(async () => ({ success: true })), setToast: jest.fn() });
  return render(
    <AuthContext.Provider value={auth}>
      <UserPageSubscriptionsUpcoming
        profileKey="p"
        details={details}
        memes_subscriptions={[sub]}
        readonly={false}
        refresh={jest.fn()}
      />
    </AuthContext.Provider>
  );
}

test('toggles subscription and posts update', async () => {
  const user = userEvent.setup();
  (commonApiPost as jest.Mock).mockResolvedValue({ token_id:1, subscribed:false });
  const { container } = renderComp();
  await user.click(screen.getByTestId('toggle'));
  expect(commonApiPost).toHaveBeenCalled();
});
