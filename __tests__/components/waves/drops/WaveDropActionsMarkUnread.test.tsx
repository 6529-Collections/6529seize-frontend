import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WaveDropActionsMarkUnread from '@/components/waves/drops/WaveDropActionsMarkUnread';
import { AuthContext } from '@/components/auth/Auth';
import { ApiDrop } from '@/generated/models/ApiDrop';

jest.mock('@/services/api/common-api', () => ({
  commonApiPost: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('@/contexts/wave/UnreadDividerContext', () => ({
  useUnreadDividerOptional: () => ({
    setUnreadDividerSerialNo: jest.fn(),
  }),
}));

jest.mock('@/contexts/wave/MyStreamContext', () => ({
  useMyStream: () => ({
    waves: {
      restoreWaveUnreadCount: jest.fn(),
    },
    directMessages: {
      restoreWaveUnreadCount: jest.fn(),
    },
  }),
}));

jest.mock('react-tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
}));

const mockAuthContext = {
  setToast: jest.fn(),
  connectedProfile: {
    handle: 'test-user',
  },
  activeProfileProxy: null,
};

const mockDrop: ApiDrop = {
  id: 'drop-123',
  serial_no: 42,
  wave: {
    id: 'wave-456',
    name: 'Test Wave',
  },
  author: {
    handle: 'other-author',
  },
} as any;

describe('WaveDropActionsMarkUnread', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <WaveDropActionsMarkUnread drop={mockDrop} />
      </AuthContext.Provider>
    );
  };

  it('renders mark unread button', () => {
    renderComponent();
    expect(screen.getByLabelText('Mark as unread')).toBeInTheDocument();
  });

  it('calls API when clicked', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockResolvedValue({
      your_unread_drops_count: 5,
      first_unread_drop_serial_no: 42,
    });

    renderComponent();
    
    await userEvent.click(screen.getByLabelText('Mark as unread'));

    await waitFor(() => {
      expect(commonApiPost).toHaveBeenCalledWith({
        endpoint: 'drops/drop-123/mark-unread',
        body: {},
      });
    });
  });

  it('shows success toast on success', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockResolvedValue({
      your_unread_drops_count: 5,
      first_unread_drop_serial_no: 42,
    });

    renderComponent();
    
    await userEvent.click(screen.getByLabelText('Mark as unread'));

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        message: 'Marked as unread',
        type: 'success',
      });
    });
  });

  it('shows error toast on failure', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockRejectedValue('API Error');

    renderComponent();
    
    await userEvent.click(screen.getByLabelText('Mark as unread'));

    await waitFor(() => {
      expect(mockAuthContext.setToast).toHaveBeenCalledWith({
        message: 'API Error',
        type: 'error',
      });
    });
  });

  it('shows loading spinner while marking unread', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockImplementation(() => new Promise(() => {}));

    renderComponent();
    
    await userEvent.click(screen.getByLabelText('Mark as unread'));

    await waitFor(() => {
      expect(screen.getByLabelText('Mark as unread').querySelector('.spinner')).toBeInTheDocument();
    });
  });

  it('disables button while loading', async () => {
    const { commonApiPost } = require('@/services/api/common-api');
    commonApiPost.mockImplementation(() => new Promise(() => {}));

    renderComponent();
    
    const button = screen.getByLabelText('Mark as unread');
    await userEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });
});

