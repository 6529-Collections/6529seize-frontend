import { render, screen } from '@testing-library/react';
import React from 'react';
import CommonProfileLink from '../../../../components/user/utils/CommonProfileLink';
import { UserPageTabType } from '../../../../components/user/layout/UserPageTabs';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
jest.mock('../../../../helpers/Helpers', () => ({ getProfileTargetRoute: jest.fn(() => '/target') }));
jest.mock('next/navigation', () => ({ usePathname: () => '/testuser/collected' }));

const { getProfileTargetRoute } = require('../../../../helpers/Helpers');

describe('CommonProfileLink', () => {
  it('disables link for current user', () => {
    render(<CommonProfileLink handleOrWallet="alice" isCurrentUser={true} tabTarget={UserPageTabType.COLLECTED} />);
    const link = screen.getByRole('link');
    expect(link).toHaveClass('tw-pointer-events-none');
  });

  it('computes target route', () => {
    render(<CommonProfileLink handleOrWallet="bob" isCurrentUser={false} tabTarget={UserPageTabType.COLLECTED} />);
    expect(getProfileTargetRoute).toHaveBeenCalled();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/target');
  });
});
