import { render, screen } from '@testing-library/react';
import NotificationWaveCreated from '@/components/brain/notifications/wave-created/NotificationWaveCreated';

const queryMock = jest.fn();
jest.mock('@tanstack/react-query', () => ({ useQuery: (...args:any[]) => queryMock(...args) }));
jest.mock('next/link', () => ({ __esModule: true, default: (p:any) => <a {...p}>{p.children}</a> }));
jest.mock('@/components/waves/header/WaveHeaderFollow', () => ({ __esModule: true, default: () => <div data-testid="wave-follow" />, WaveFollowBtnSize:{} }));
jest.mock('@/components/brain/notifications/NotificationsFollowBtn', () => ({ __esModule: true, default: () => <div data-testid="follow-btn" /> }));
jest.mock('@/helpers/image.helpers', () => ({ getScaledImageUri: () => '/scaled.jpg', ImageScale:{} }));
jest.mock('@/helpers/Helpers', () => ({ getTimeAgoShort: () => '1m' }));

const notification = {
  related_identity: { handle: 'alice', pfp: 'pfp.png' },
  additional_context: { wave_id: '1' },
  created_at: '2024-01-01T00:00:00Z'
} as any;

it('renders wave data and links', () => {
  queryMock.mockReturnValue({
    data: {
      id: '1',
      name: 'Wave 1',
      chat: {
        scope: {
          group: {
            is_direct_message: false
          }
        }
      }
    }
  });
  render(<NotificationWaveCreated notification={notification} />);
  expect(screen.getByRole('link', { name: 'alice' })).toHaveAttribute('href', '/alice');
  expect(screen.getByRole('link', { name: 'Wave 1' })).toHaveAttribute('href', '/waves?wave=1');
  expect(screen.getByTestId('wave-follow')).toBeInTheDocument();
  expect(screen.getByTestId('follow-btn')).toBeInTheDocument();
  const img = screen.getByRole('img');
  expect(img.getAttribute('src')).toContain('scaled.jpg');
});
