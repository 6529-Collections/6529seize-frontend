import { render, screen } from '@testing-library/react';
import UserPageTab from '@/components/user/layout/UserPageTab';
import { USER_PAGE_TAB_IDS, USER_PAGE_TAB_MAP } from '@/components/user/layout/userTabs.config';
import { useParams, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));
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
    (useParams as jest.Mock).mockReturnValue({ user: 'bob' });
    (useSearchParams as jest.Mock).mockReturnValue({ get: (k: string) => (k === 'address' ? '0x1' : null) });
    const repTab = USER_PAGE_TAB_MAP[USER_PAGE_TAB_IDS.REP];
    const { rerender } = render(
      <UserPageTab
        tab={repTab}
        parentRef={{ current: null }}
        activeTabId={USER_PAGE_TAB_IDS.REP}
      />
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/bob/rep?address=0x1');
    expect(link).toHaveClass('tw-pointer-events-none');
    rerender(
      <UserPageTab
        tab={repTab}
        parentRef={{ current: null }}
        activeTabId={USER_PAGE_TAB_IDS.BRAIN}
      />
    );
    expect(link).not.toHaveClass('tw-pointer-events-none');
  });
});
