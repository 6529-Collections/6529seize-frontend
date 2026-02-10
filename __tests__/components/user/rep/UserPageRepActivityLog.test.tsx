import { render, screen } from '@testing-library/react';
import UserPageRepActivityLog from '@/components/user/rep/UserPageRepActivityLog';

jest.mock('@/components/profile-activity/ProfileActivityLogs', () => (props: any) => (
  <div data-testid="logs">{JSON.stringify(props.initialParams)}</div>
));
jest.mock('@/components/profile-activity/ProfileName', () => ({
  __esModule: true,
  default: () => <span>ProfileName</span>,
  ProfileNameType: { POSSESSION: 'POSSESSION' }
}));

const params = { page: 1 } as any;

describe('UserPageRepActivityLog', () => {
  it('renders activity log component', () => {
    render(<UserPageRepActivityLog initialActivityLogParams={params} />);
    expect(screen.getByText('Rep Activity Log')).toBeInTheDocument();
    expect(screen.getByTestId('logs')).toHaveTextContent('page');
  });
});
