import { render, screen } from '@testing-library/react';
import React from 'react';
import CommonProfileLink from '@/components/user/utils/CommonProfileLink';
import { USER_PAGE_TAB_IDS } from '@/components/user/layout/userTabs.config';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
jest.mock('@/helpers/Helpers', () => ({ getProfileTargetRoute: jest.fn(() => '/target') }));
jest.mock('next/navigation', () => ({ usePathname: () => '/testuser/collected' }));

const { getProfileTargetRoute } = require('@/helpers/Helpers');

describe('CommonProfileLink', () => {
  it('disables link for current user', () => {
    render(<CommonProfileLink handleOrWallet="alice" isCurrentUser={true} tabTarget={USER_PAGE_TAB_IDS.COLLECTED} />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('tw-pointer-events-none');
  });

  it('computes target route', () => {
    render(<CommonProfileLink handleOrWallet="bob" isCurrentUser={false} tabTarget={USER_PAGE_TAB_IDS.COLLECTED} />);
    expect(getProfileTargetRoute).toHaveBeenCalled();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/target');
  });
});
