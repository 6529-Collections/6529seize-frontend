import { render } from '@testing-library/react';
import BottomNavigation, { items } from '../../../components/navigation/BottomNavigation';
import NavItem from '../../../components/navigation/NavItem';
import { useLayout } from '../../../components/brain/my-stream/layout/LayoutContext';

jest.mock('../../../components/navigation/NavItem', () => ({ __esModule: true, default: jest.fn(() => <div data-testid="nav-item" />) }));
jest.mock('../../../components/brain/my-stream/layout/LayoutContext', () => ({ useLayout: jest.fn() }));

const registerRef = jest.fn();
(useLayout as jest.Mock).mockReturnValue({ registerRef });

beforeEach(() => {
  jest.clearAllMocks();
  (useLayout as jest.Mock).mockReturnValue({ registerRef });
});

describe('BottomNavigation', () => {
  it('registers mobileNav ref and renders nav items', () => {
    const { container } = render(<BottomNavigation />);
    expect(registerRef).toHaveBeenCalledWith('mobileNav', expect.any(HTMLElement));
    // Expect one nav item per item definition
    const rendered = container.querySelectorAll('[data-testid="nav-item"]');
    expect(rendered).toHaveLength(items.length);
    // Ensure NavItem called with each item
    items.forEach((item, index) => {
      expect((NavItem as jest.Mock).mock.calls[index][0]).toEqual({ item });
    });
  });
});
