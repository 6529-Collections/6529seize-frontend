import { render, screen } from '@testing-library/react';
import UserPageIdentityActivityLog from '@/components/user/identity/activity/UserPageIdentityActivityLog';

jest.mock('@/components/profile-activity/ProfileActivityLogs', () => (props: any) => (
  <div data-testid="activity" data-props={JSON.stringify(props)} />
));

jest.mock('@/components/profile-activity/ProfileName', () => ({
  __esModule: true,
  default: (props: any) => <span data-testid="name">{props.type}</span>,
}));

jest.mock('@/components/user/utils/UserTableHeaderWrapper', () => (props: any) => (
  <div data-testid="wrapper">{props.children}</div>
));

describe('UserPageIdentityActivityLog', () => {
  it('passes initial params to activity logs', () => {
    const params = { limit: 5 } as any;
    const data = { data: [], page: 1, next: false } as any;
    render(
      <UserPageIdentityActivityLog
        initialActivityLogParams={params}
        initialActivityLogData={data}
      />
    );
    const activity = screen.getByTestId('activity');
    const props = JSON.parse(activity.getAttribute('data-props') || '{}');
    expect(props.initialParams).toEqual(params);
    expect(props.withFilters).toBe(true);
    expect(props.initialData).toEqual(data);
    expect(screen.getByText('NIC Activity Log')).toBeInTheDocument();
  });
});
