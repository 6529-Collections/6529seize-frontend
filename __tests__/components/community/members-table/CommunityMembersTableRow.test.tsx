import { render, screen } from '@testing-library/react';
import CommunityMembersTableRow from '../../../../components/community/members-table/CommunityMembersTableRow';

jest.mock('../../../../helpers/image.helpers', () => ({
  ImageScale: { W_AUTO_H_50: 'W_AUTO_H_50' },
  getScaledImageUri: () => '/scaled.png',
}));

jest.mock('../../../../components/user/utils/level/UserLevel', () => ({
  __esModule: true,
  default: () => <div data-testid="level" />,
}));

jest.mock('../../../../components/user/utils/user-cic-type/UserCICTypeIcon', () => ({
  __esModule: true,
  default: () => <div data-testid="cic-icon" />,
}));

jest.mock('../../../../components/utils/CommonTimeAgo', () => ({
  __esModule: true,
  default: () => <span data-testid="timeago">ago</span>,
}));

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));

describe('CommunityMembersTableRow', () => {
  const member = {
    display: 'User',
    detail_view_key: 'userkey',
    level: 2,
    tdh: 10,
    rep: 5,
    cic: 1,
    pfp: 'pfp.png',
    last_activity: 123,
    wallet: '0x1',
  };

  it('renders member info and link', () => {
    render(<table><tbody><CommunityMembersTableRow member={member} rank={3} /></tbody></table>);
    expect(screen.getByText('3')).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/userkey');
    expect(link).toHaveTextContent('User');
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByTestId('level')).toBeInTheDocument();
    expect(screen.getByTestId('cic-icon')).toBeInTheDocument();
    expect(screen.getByTestId('timeago')).toBeInTheDocument();
    const img = screen.getByAltText('Network Table Profile Picture') as HTMLImageElement;
    expect(img.src).toContain('/scaled.png');
  });
});
