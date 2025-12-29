import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveMute from '@/components/waves/header/options/mute/WaveMute';
import { AuthContext } from '@/components/auth/Auth';
import { ApiWave } from '@/generated/models/ApiWave';

jest.mock('@/services/api/common-api', () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

const mockAuthContext = {
  setToast: jest.fn(),
};

const mockWaveNotMuted: ApiWave = {
  id: 'wave-123',
  name: 'Test Wave',
  metrics: {
    muted: false,
  },
} as any;

const mockWaveMuted: ApiWave = {
  id: 'wave-456',
  name: 'Muted Wave',
  metrics: {
    muted: true,
  },
} as any;

describe('WaveMute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (wave: ApiWave, onSuccess?: () => void) => {
    return render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <WaveMute wave={wave} onSuccess={onSuccess} />
      </AuthContext.Provider>
    );
  };

  it('renders Mute button when wave is not muted', () => {
    renderComponent(mockWaveNotMuted);
    
    expect(screen.getByRole('menuitem')).toHaveTextContent('Mute');
  });

  it('renders Unmute button when wave is muted', () => {
    renderComponent(mockWaveMuted);
    
    expect(screen.getByRole('menuitem')).toHaveTextContent('Unmute');
  });

  it('calls mute API when clicking Mute', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    const onSuccess = jest.fn();
    commonApiPost.mockResolvedValue({});
    
    renderComponent(mockWaveNotMuted, onSuccess);
    
    await userEvent.click(screen.getByRole('menuitem'));
    
    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: 'waves/wave-123/mute',
        body: {},
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls unmute API when clicking Unmute', async () => {
    const { commonApiDelete } = require('@/services/api/common-api');
    const onSuccess = jest.fn();
    commonApiDelete.mockResolvedValue({});
    
    renderComponent(mockWaveMuted, onSuccess);
    
    await userEvent.click(screen.getByRole('menuitem'));
    
    await waitFor(() => {
      expect(commonApiDelete).toHaveBeenCalledWith({
        endpoint: 'waves/wave-456/mute',
      });
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows Muting with spinner while muting', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockImplementation(() => new Promise(() => {}));
    
    renderComponent(mockWaveNotMuted);
    
    await userEvent.click(screen.getByRole('menuitem'));
    
    await waitFor(() => {
      expect(screen.getByRole('menuitem')).toHaveTextContent('Muting');
      expect(screen.getByRole('menuitem').querySelector('.spinner')).toBeInTheDocument();
    });
  });

  it('shows Unmuting with spinner while unmuting', async () => {
    const { commonApiDelete } = require('@/services/api/common-api');
    commonApiDelete.mockImplementation(() => new Promise(() => {}));
    
    renderComponent(mockWaveMuted);
    
    await userEvent.click(screen.getByRole('menuitem'));
    
    await waitFor(() => {
      expect(screen.getByRole('menuitem')).toHaveTextContent('Unmuting');
      expect(screen.getByRole('menuitem').querySelector('.spinner')).toBeInTheDocument();
    });
  });

  it('handles error when muting fails', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockRejectedValue('Unable to mute wave');
    
    renderComponent(mockWaveNotMuted);
    
    await userEvent.click(screen.getByRole('menuitem'));
    
    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        message: 'Unable to mute wave',
        type: 'error',
      });
    });
  });

  it('handles error when unmuting fails', async () => {
    const { commonApiDelete } = require('@/services/api/common-api');
    commonApiDelete.mockRejectedValue('Unable to unmute wave');
    
    renderComponent(mockWaveMuted);
    
    await userEvent.click(screen.getByRole('menuitem'));
    
    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        message: 'Unable to unmute wave',
        type: 'error',
      });
    });
  });

  it('disables button while loading', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockImplementation(() => new Promise(() => {}));
    
    renderComponent(mockWaveNotMuted);
    
    const menuitem = screen.getByRole('menuitem');
    await userEvent.click(menuitem);
    
    await waitFor(() => {
      expect(menuitem).toBeDisabled();
    });
  });
});

