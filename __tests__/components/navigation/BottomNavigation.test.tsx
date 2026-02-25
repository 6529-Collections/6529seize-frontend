import { render } from '@testing-library/react';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import NavItem from '@/components/navigation/NavItem';
import { useLayout } from '@/components/brain/my-stream/layout/LayoutContext';
import useCapacitor from '@/hooks/useCapacitor';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { useWave } from '@/hooks/useWave';
import { useWaveData } from '@/hooks/useWaveData';
import { getNotificationsRoute } from '@/helpers/navigation.helpers';

jest.mock('@/components/navigation/NavItem', () => ({ __esModule: true, default: jest.fn(() => <div data-testid="nav-item" />) }));
jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: jest.fn() }));
jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/hooks/useDeviceInfo', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/hooks/useWaveData', () => ({ useWaveData: jest.fn() }));
jest.mock('@/hooks/useWave', () => ({ useWave: jest.fn() }));
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const registerRef = jest.fn();
(useLayout as jest.Mock).mockReturnValue({ registerRef });
(useCapacitor as jest.Mock).mockReturnValue({ isAndroid: false });
(useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
(useWaveData as jest.Mock).mockReturnValue({ data: null });
(useWave as jest.Mock).mockReturnValue({ isDm: false });

const { usePathname, useSearchParams } = require('next/navigation');
(usePathname as jest.Mock).mockReturnValue('/');
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

beforeEach(() => {
  jest.clearAllMocks();
  (useLayout as jest.Mock).mockReturnValue({ registerRef });
  (useCapacitor as jest.Mock).mockReturnValue({ isAndroid: false });
  (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
  (useWaveData as jest.Mock).mockReturnValue({ data: null });
  (useWave as jest.Mock).mockReturnValue({ isDm: false });
  (usePathname as jest.Mock).mockReturnValue('/');
  (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
});

describe('BottomNavigation', () => {
  it('registers mobileNav ref and renders nav items', () => {
    const { container } = render(<BottomNavigation />);

    expect(registerRef).toHaveBeenCalledWith('mobileNav', expect.any(HTMLElement));

    const rendered = container.querySelectorAll('[data-testid="nav-item"]');
    const navItemCalls = (NavItem as jest.Mock).mock.calls;

    expect(rendered).toHaveLength(navItemCalls.length);
    expect(navItemCalls).toHaveLength(7);

    const passedItems = navItemCalls.map((call) => call[0].item);
    expect(passedItems.map((item: { name: string }) => item.name)).toEqual([
      'Discover',
      'Waves',
      'Messages',
      'Home',
      'Network',
      'Collections',
      'Notifications',
    ]);

    const notificationsItem = passedItems.find((item: { name: string }) => item.name === 'Notifications');
    expect(notificationsItem?.href).toBe(getNotificationsRoute(false));
  });
});
