import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AppSidebarHeader from '../../../components/header/AppSidebarHeader';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('../../../components/header/AppSidebarUserInfo', () => (props: any) => <div data-testid="userinfo" {...props} />);
jest.mock('../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));

const { useSeizeConnectContext } = require('../../../components/auth/SeizeConnectContext');

function setup(address: string | undefined) {
  const onClose = jest.fn();
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address });
  render(<AppSidebarHeader onClose={onClose} />);
  return { onClose };
}

describe('AppSidebarHeader', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows user info when connected', () => {
    setup('0xabc');
    expect(screen.getByTestId('userinfo')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Home' })).toBeNull();
  });

  it('shows home link when not connected', () => {
    setup(undefined);
    const link = screen.getByRole('link', { name: 'Home' });
    expect(link).toHaveAttribute('href', '/');
    expect(screen.getByAltText('6529')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const { onClose } = setup('0xabc');
    const btn = screen.getByRole('button', { name: 'Close menu' });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });
});
