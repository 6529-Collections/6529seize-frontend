import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveNotificationSettings from '@/components/waves/specs/WaveNotificationSettings';
import { AuthContext } from '@/components/auth/Auth';
import { ApiWave } from '@/generated/models/ApiWave';

jest.mock('@/hooks/useWaveNotificationSubscription', () => ({
  useWaveNotificationSubscription: jest.fn(),
}));

jest.mock('@/services/api/common-api', () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock('@/contexts/SeizeSettingsContext', () => ({
  useSeizeSettings: () => ({
    seizeSettings: {
      all_drops_notifications_subscribers_limit: 1000,
    },
  }),
}));

jest.mock('react-bootstrap', () => ({
  OverlayTrigger: ({ children }: any) => children,
  Tooltip: ({ children }: any) => <div>{children}</div>,
}));

const mockWave: ApiWave = {
  id: 'wave-123',
  name: 'Test Wave',
  metrics: {
    subscribers_count: 50,
  },
  subscribed_actions: ['follow'],
} as any;

const mockWaveHighSubscribers: ApiWave = {
  id: 'wave-456',
  name: 'Popular Wave',
  metrics: {
    subscribers_count: 1500,
  },
  subscribed_actions: ['follow'],
} as any;

const mockAuthContext = {
  setToast: jest.fn(),
};

const mockUseWaveNotificationSubscription = require('@/hooks/useWaveNotificationSubscription').useWaveNotificationSubscription;

describe('WaveNotificationSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false },
      refetch: jest.fn(),
    });
  });

  const renderComponent = (wave = mockWave) => {
    return render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <WaveNotificationSettings wave={wave} />
      </AuthContext.Provider>
    );
  };

  it('does not render when not following wave', () => {
    const waveNotFollowing = { ...mockWave, subscribed_actions: [] };
    const { container } = renderComponent(waveNotFollowing);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders notification buttons when following wave', () => {
    renderComponent();
    
    expect(screen.getByLabelText('Receive mentions-only notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Receive all notifications')).toBeInTheDocument();
  });

  it('shows mentions button as active when all notifications disabled', () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false },
      refetch: jest.fn(),
    });
    
    renderComponent();
    
    const mentionsButton = screen.getByLabelText('Receive mentions-only notifications');
    expect(mentionsButton).toHaveClass('tw-bg-iron-800', 'tw-text-primary-400');
  });

  it('shows all button as active when all notifications enabled', () => {
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true },
      refetch: jest.fn(),
    });
    
    renderComponent();
    
    const allButton = screen.getByLabelText('Receive all notifications');
    expect(allButton).toHaveClass('tw-bg-iron-800', 'tw-text-primary-400');
  });

  it('disables all notifications button when subscriber limit reached', () => {
    renderComponent(mockWaveHighSubscribers);
    
    const allButton = screen.getByLabelText('Receive all notifications');
    expect(allButton).toBeDisabled();
    expect(allButton).toHaveClass('tw-cursor-not-allowed');
  });

  it('enables all notifications when clicking all button', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    const refetch = jest.fn();
    
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false },
      refetch,
    });
    
    commonApiPost.mockResolvedValue({});
    
    renderComponent();
    
    const allButton = screen.getByLabelText('Receive all notifications');
    await userEvent.click(allButton);
    
    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: 'notifications/wave-subscription/wave-123',
        body: {},
      });
    });
    
    expect(refetch).toHaveBeenCalled();
  });

  it('disables all notifications when clicking mentions button', async () => {
    const { commonApiDelete } = require('@/services/api/common-api');
    const refetch = jest.fn();
    
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true },
      refetch,
    });
    
    commonApiDelete.mockResolvedValue({});
    
    renderComponent();
    
    const mentionsButton = screen.getByLabelText('Receive mentions-only notifications');
    await userEvent.click(mentionsButton);
    
    await waitFor(() => {
      expect(commonApiDelete).toHaveBeenCalledWith({
        endpoint: 'notifications/wave-subscription/wave-123',
      });
    });
    
    expect(refetch).toHaveBeenCalled();
  });

  it('handles API error when enabling all notifications', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    const refetch = jest.fn();
    
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false },
      refetch,
    });
    
    commonApiPost.mockRejectedValue('API Error');
    
    renderComponent();
    
    const allButton = screen.getByLabelText('Receive all notifications');
    await userEvent.click(allButton);
    
    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        message: 'API Error',
        type: 'error',
      });
    });
  });

  it('handles API error when disabling all notifications', async () => {
    const { commonApiDelete } = require('@/services/api/common-api');
    const refetch = jest.fn();
    
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true },
      refetch,
    });
    
    commonApiDelete.mockRejectedValue('Unable to update subscription');
    
    renderComponent();
    
    const mentionsButton = screen.getByLabelText('Receive mentions-only notifications');
    await userEvent.click(mentionsButton);
    
    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        message: 'Unable to update subscription',
        type: 'error',
      });
    });
  });

  it('shows loading spinner when toggling notifications', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    const refetch = jest.fn();
    
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: false },
      refetch,
    });
    
    // Make the API call hang to test loading state
    commonApiPost.mockImplementation(() => new Promise(() => {}));
    
    renderComponent();
    
    const allButton = screen.getByLabelText('Receive all notifications');
    await userEvent.click(allButton);
    
    // Check for spinner in the button
    await waitFor(() => {
      expect(allButton.querySelector('.spinner')).toBeInTheDocument();
    });
  });

  it('does not call API when clicking same notification setting', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    
    mockUseWaveNotificationSubscription.mockReturnValue({
      data: { subscribed: true },
      refetch: jest.fn(),
    });
    
    renderComponent();
    
    const allButton = screen.getByLabelText('Receive all notifications');
    await userEvent.click(allButton);
    
    expect(commonApiPost).not.toHaveBeenCalled();
  });

  it('disables all button when wave has high subscriber count', () => {
    renderComponent(mockWaveHighSubscribers);
    
    const allButton = screen.getByLabelText('Receive all notifications');
    expect(allButton).toBeDisabled();
  });
});