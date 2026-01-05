import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfileTooltipWrapper from '@/components/utils/tooltip/UserProfileTooltipWrapper';

// Mock the CustomTooltip component
jest.mock('@/components/utils/tooltip/CustomTooltip', () => {
  return function MockCustomTooltip({ 
    children, 
    content, 
    placement,
    delayShow,
    delayHide
  }: {
    children: React.ReactElement;
    content: React.ReactNode;
    placement?: string | undefined;
    delayShow?: number | undefined;
    delayHide?: number | undefined;
  }) {
    return (
      <div data-testid="custom-tooltip" data-placement={placement} data-delay-show={delayShow} data-delay-hide={delayHide}>
        {children}
        <div data-testid="tooltip-content">{content}</div>
      </div>
    );
  };
});

// Mock UserProfileTooltip component
jest.mock('@/components/user/utils/profile/UserProfileTooltip', () => {
  return function MockUserProfileTooltip({ user }: { user: string }) {
    return <div data-testid="user-profile-tooltip">Profile for {user}</div>;
  };
});

// Mock useDeviceInfo hook
jest.mock('@/hooks/useDeviceInfo', () => ({
  __esModule: true,
  default: () => ({
    hasTouchScreen: false,
  }),
}));

describe('UserProfileTooltipWrapper', () => {
  it('renders with default placement', () => {
    render(
      <UserProfileTooltipWrapper user="testuser">
        <button>Test Button</button>
      </UserProfileTooltipWrapper>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
    expect(screen.getByTestId('custom-tooltip')).toHaveAttribute('data-placement', 'auto');
    expect(screen.getByTestId('custom-tooltip')).toHaveAttribute('data-delay-show', '500');
    expect(screen.getByTestId('custom-tooltip')).toHaveAttribute('data-delay-hide', '0');
    expect(screen.getByText('Profile for testuser')).toBeInTheDocument();
  });

  it('renders with custom placement', () => {
    render(
      <UserProfileTooltipWrapper user="testuser" placement="top">
        <button>Test Button</button>
      </UserProfileTooltipWrapper>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
    expect(screen.getByTestId('custom-tooltip')).toHaveAttribute('data-placement', 'top');
  });

  it('renders children only on touch devices', () => {
    // Mock touch device
    const mockUseDeviceInfo = jest.fn(() => ({
      hasTouchScreen: true,
    }));
    
    jest.doMock('../../../../hooks/useDeviceInfo', () => ({
      __esModule: true,
      default: mockUseDeviceInfo,
    }));

    // Clear cache and re-import
    jest.resetModules();
    const { default: UserProfileTooltipWrapperWithTouch } = require('@/components/utils/tooltip/UserProfileTooltipWrapper');

    render(
      <UserProfileTooltipWrapperWithTouch user="testuser">
        <button>Test Button</button>
      </UserProfileTooltipWrapperWithTouch>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
    expect(screen.queryByTestId('custom-tooltip')).not.toBeInTheDocument();
  });
});