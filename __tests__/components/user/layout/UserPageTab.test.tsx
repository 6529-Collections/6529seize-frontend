import { render, screen } from '@testing-library/react';
import UserPageTab from '../../../../components/user/layout/UserPageTab';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UserPageTabType } from '../../../../components/user/layout/UserPageTabs';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('next/link', () => (props: any) => (
  <a
    data-testid="link"
    href={props.href.pathname + (props.href.query ? '?address=' + props.href.query.address : '')}
    className={props.className}
  >
    {props.children}
  </a>
));

describe('UserPageTab', () => {
  it('renders active and inactive states', () => {
    (useRouter as jest.Mock).mockReturnValue({ pathname: '/[user]/rep', query: { user: 'bob', address: '0x1' } });
    const { rerender } = render(<UserPageTab tab={UserPageTabType.REP} parentRef={{ current: null }} activeTab={UserPageTabType.REP} />);
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/bob/rep?address=0x1');
    expect(link).toHaveClass('tw-pointer-events-none');
    rerender(<UserPageTab tab={UserPageTabType.REP} parentRef={{ current: null }} activeTab={UserPageTabType.BRAIN} />);
    expect(link).not.toHaveClass('tw-pointer-events-none');
  });
});
