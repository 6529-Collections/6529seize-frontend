import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppSidebarMenuItems, { MenuItem } from '../../../components/header/AppSidebarMenuItems';
import { useSeizeConnectContext } from '../../../components/auth/SeizeConnectContext';
import { useIdentity } from '../../../hooks/useIdentity';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
jest.mock('../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));
jest.mock('../../../hooks/useIdentity', () => ({ useIdentity: jest.fn() }));

const { useSeizeConnectContext: useCtx } = require('../../../components/auth/SeizeConnectContext');
const { useIdentity: useId } = require('../../../hooks/useIdentity');

afterEach(() => jest.clearAllMocks());

describe('AppSidebarMenuItems', () => {
  const baseMenu: MenuItem[] = [
    { label: 'Profile', path: '/profile' },
    { label: 'About', path: '/about' },
  ];

  it('filters profile link when not connected', () => {
    (useCtx as jest.Mock).mockReturnValue({ address: undefined });
    (useId as jest.Mock).mockReturnValue({ profile: null });
    render(<AppSidebarMenuItems menu={baseMenu} onNavigate={jest.fn()} />);
    expect(screen.queryByText('Profile')).toBeNull();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('uses wallet address for profile path', async () => {
    (useCtx as jest.Mock).mockReturnValue({ address: '0xABC' });
    (useId as jest.Mock).mockReturnValue({ profile: null });
    const onNavigate = jest.fn();
    render(<AppSidebarMenuItems menu={baseMenu} onNavigate={onNavigate} />);
    const link = screen.getByRole('link', { name: 'Profile' });
    expect(link).toHaveAttribute('href', '/0xabc');
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });

  it('renders section children', async () => {
    (useCtx as jest.Mock).mockReturnValue({ address: '0xABC' });
    (useId as jest.Mock).mockReturnValue({ profile: { handle: 'Alice' } });
    const menu: MenuItem[] = [
      {
        label: 'More',
        children: [
          { label: 'Section', section: true },
          { label: 'Item', path: '/item' },
        ],
      },
    ];
    render(<AppSidebarMenuItems menu={menu} onNavigate={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Item' })).toHaveAttribute('href', '/item');
  });
});
