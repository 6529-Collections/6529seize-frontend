import { render, screen } from '@testing-library/react';
import CommunityMembersTableRow from '../../../../components/community/members-table/CommunityMembersTableRow';
import { CommunityMemberOverview } from '../../../../entities/IProfile';

jest.mock('../../../../helpers/Helpers', () => ({
  formatNumberWithCommasOrDash: (n: number) => `#${n}`,
  cicToType: (n: number) => n,
}));

jest.mock('../../../../helpers/AllowlistToolHelpers', () => ({
  isEthereumAddress: (val: string) => val.startsWith('0x'),
}));

jest.mock('../../../../helpers/image.helpers', () => ({
  ImageScale: { W_AUTO_H_50: 'AUTOx50' },
  getScaledImageUri: (url: string) => `scaled-${url}`,
}));

jest.mock('../../../../components/user/utils/level/UserLevel', () => () => <div data-testid="level" />);
jest.mock('../../../../components/user/utils/user-cic-type/UserCICTypeIcon', () => () => <div data-testid="icon" />);
jest.mock('../../../../components/utils/CommonTimeAgo', () => () => <span data-testid="time" />);
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));
jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }));

const baseMember: CommunityMemberOverview = {
  display: 'Alice',
  detail_view_key: 'alice',
  level: 1,
  tdh: 10,
  rep: 5,
  cic: 2,
  pfp: 'pfp.png',
  last_activity: 123,
  wallet: '0x123',
};

describe('CommunityMembersTableRow', () => {
  it('renders profile member info', () => {
    render(
      <table>
        <tbody>
          <CommunityMembersTableRow member={baseMember} rank={1} />
        </tbody>
      </table>
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/alice');
    expect(screen.getByRole('link')).toHaveTextContent('Alice');
    expect(screen.getAllByText('#10')[0]).toBeInTheDocument();
    expect(screen.getAllByText('#5')[0]).toBeInTheDocument();
    expect(screen.getByTestId('level')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('time')).toBeInTheDocument();
  });

  it('applies address styles when detail_view_key is address', () => {
    const member = { ...baseMember, detail_view_key: '0xabc', display: '0xabc' };
    render(
      <table>
        <tbody>
          <CommunityMembersTableRow member={member} rank={2} />
        </tbody>
      </table>
    );
    const rows = screen.getAllByRole('row');
    expect(rows[0].querySelector('.tw-opacity-50')).not.toBeNull();
  });
});
