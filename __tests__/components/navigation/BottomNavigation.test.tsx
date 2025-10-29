import { render } from '@testing-library/react';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import NavItem from '@/components/navigation/NavItem';
import { useLayout } from '@/components/brain/my-stream/layout/LayoutContext';
import useCapacitor from '@/hooks/useCapacitor';
import useDeviceInfo from '@/hooks/useDeviceInfo';
import { getNotificationsRoute } from '@/helpers/navigation.helpers';

jest.mock('@/components/navigation/NavItem', () => ({ __esModule: true, default: jest.fn(() => <div data-testid="nav-item" />) }));
jest.mock('@/components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: jest.fn() }));
jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/hooks/useDeviceInfo', () => ({ __esModule: true, default: jest.fn() }));

const registerRef = jest.fn();
(useLayout as jest.Mock).mockReturnValue({ registerRef });
(useCapacitor as jest.Mock).mockReturnValue({ isAndroid: false });
(useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });

beforeEach(() => {
  jest.clearAllMocks();
  (useLayout as jest.Mock).mockReturnValue({ registerRef });
  (useCapacitor as jest.Mock).mockReturnValue({ isAndroid: false });
  (useDeviceInfo as jest.Mock).mockReturnValue({ isApp: false });
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
      'Home',
      'Waves',
      'Messages',
      'Stream',
      'Network',
      'Collections',
      'Notifications',
    ]);

    const notificationsItem = passedItems.find((item: { name: string }) => item.name === 'Notifications');
    expect(notificationsItem?.href).toBe(getNotificationsRoute(false));
  });
});
