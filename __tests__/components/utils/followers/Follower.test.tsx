import { render, screen } from '@testing-library/react';
import Follower from '../../../../components/utils/followers/Follower';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

jest.mock('../../../../helpers/Helpers', () => ({ cicToType: jest.fn(() => 'UNKNOWN') }));

jest.mock('../../../../components/user/utils/UserCICAndLevel', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="cic">{props.level}</div>,
  UserCICAndLevelSize: { SMALL: 'SMALL' }
}));

const baseFollower: any = {
  identity: { handle: 'alice', level: 5, cic: 0, pfp: 'pic.png' }
};

test('renders follower info with image', () => {
  render(<Follower follower={baseFollower} />);
  expect(screen.getByRole('link')).toHaveAttribute('href', '/alice');
  expect(screen.getByAltText("alice's profile")).toBeInTheDocument();
  expect(screen.getByTestId('cic')).toHaveTextContent('5');
});

test('shows placeholder when no pfp', () => {
  const follower = { identity: { handle: 'bob', level: 1, cic: 0, pfp: '' } } as any;
  const { container } = render(<Follower follower={follower} />);
  expect(container.querySelector('img')).toBeNull();
});
