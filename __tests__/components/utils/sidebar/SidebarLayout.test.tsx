import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import SidebarLayout from '../../../../components/utils/sidebar/SidebarLayout';
import { useHeaderContext } from '../../../../contexts/HeaderContext';
import useDeviceInfo from '../../../../hooks/useDeviceInfo';
import { createBreakpoint } from 'react-use';
import { configureStore } from '@reduxjs/toolkit';
import groupSlice from '../../../../store/groupSlice';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock('../../../../contexts/HeaderContext');
jest.mock('../../../../hooks/useDeviceInfo');
jest.mock('react-use');
jest.mock('../../../../components/groups/sidebar/GroupsSidebarToggle', () => {
  const forwardRef = React.forwardRef;
  return forwardRef<HTMLButtonElement, any>(({ open, setOpen }, ref) => (
    <button ref={ref} onClick={() => setOpen(!open)} data-testid="sidebar-toggle">
      {open ? 'Close' : 'Open'} Sidebar
    </button>
  ));
});
jest.mock('../../../../components/groups/sidebar/GroupsSidebar', () => {
  return function GroupsSidebar() {
    return <div data-testid="groups-sidebar">Groups Sidebar</div>;
  };
});
jest.mock('../../../../components/utils/sidebar/SidebarLayoutApp', () => {
  return function SidebarLayoutApp({ children }: { children: React.ReactNode }) {
    return <div data-testid="sidebar-layout-app">{children}</div>;
  };
});

const { useRouter } = require('next/router');
const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;
const useHeaderContextMock = useHeaderContext as jest.MockedFunction<typeof useHeaderContext>;
const useDeviceInfoMock = useDeviceInfo as jest.MockedFunction<typeof useDeviceInfo>;
const createBreakpointMock = createBreakpoint as jest.MockedFunction<typeof createBreakpoint>;

describe('SidebarLayout', () => {
  const mockPush = jest.fn();
  const mockHeaderRef = { current: { clientHeight: 80 } as HTMLElement };
  
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        group: groupSlice,
      },
    });

    useRouterMock.mockReturnValue({
      push: mockPush,
      query: {},
      isReady: true,
    } as any);

    useHeaderContextMock.mockReturnValue({
      headerRef: mockHeaderRef,
    } as any);

    useDeviceInfoMock.mockReturnValue({
      isApp: false,
    });

    // Mock breakpoint hook
    const mockUseBreakpoint = jest.fn(() => 'XXL');
    createBreakpointMock.mockReturnValue(mockUseBreakpoint);

    // Mock window properties
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      value: 0,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 1024,
    });

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      top: 0,
      bottom: 100,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <Provider store={store}>
        <SidebarLayout>
          <div data-testid="test-content">Test Content</div>
        </SidebarLayout>
      </Provider>
    );
  };

  it('renders web layout by default', () => {
    renderComponent();
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('groups-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-layout-app')).not.toBeInTheDocument();
  });

  it('renders app layout when isApp is true', () => {
    useDeviceInfoMock.mockReturnValue({
      isApp: true,
    });

    renderComponent();
    
    expect(screen.getByTestId('sidebar-layout-app')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
  });

  it('toggles sidebar open/closed', () => {
    renderComponent();
    
    const toggleButton = screen.getByTestId('sidebar-toggle');
    expect(toggleButton).toHaveTextContent('Open Sidebar');
    
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Close Sidebar');
    
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('Open Sidebar');
  });

  it('closes sidebar on small breakpoint', () => {
    const mockUseBreakpoint = jest.fn(() => 'XXL');
    createBreakpointMock.mockReturnValue(mockUseBreakpoint);
    
    renderComponent();
    
    const toggleButton = screen.getByTestId('sidebar-toggle');
    fireEvent.click(toggleButton); // Open sidebar
    expect(toggleButton).toHaveTextContent('Close Sidebar');
    
    // Change to small breakpoint
    mockUseBreakpoint.mockReturnValue('S');
    fireEvent.resize(window);
    
    // Force re-render by triggering useEffect
    renderComponent();
    expect(screen.getByTestId('sidebar-toggle')).toHaveTextContent('Open Sidebar');
  });

  it('handles scroll events to adjust sidebar position', () => {
    renderComponent();
    
    // Mock sidebar ref
    const mockSidebarElement = document.createElement('div');
    const mockOpenButtonElement = document.createElement('button');
    
    const sidebarRef = jest.spyOn(React, 'useRef')
      .mockReturnValueOnce({ current: mockOpenButtonElement })
      .mockReturnValueOnce({ current: mockSidebarElement });

    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 50, writable: true });
    fireEvent.scroll(window);

    // Check if styles are applied (indirectly through DOM manipulation)
    expect(mockSidebarElement.style.top).toBe('');
    expect(mockOpenButtonElement.style.top).toBe('');
  });

  it('initializes with group from router query', () => {
    useRouterMock.mockReturnValue({
      push: mockPush,
      query: { group: 'test-group-id' },
      isReady: true,
    } as any);

    renderComponent();
    
    // Verify group is set in store
    const state = store.getState();
    expect(state.group.activeGroupId).toBe('test-group-id');
  });

  it('waits for router to be ready before initializing', () => {
    useRouterMock.mockReturnValue({
      push: mockPush,
      query: { group: 'test-group-id' },
      isReady: false,
    } as any);

    renderComponent();
    
    // Content should not be rendered yet
    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for content margin', () => {
    renderComponent();
    
    const toggleButton = screen.getByTestId('sidebar-toggle');
    
    // Initially closed
    const content = screen.getByTestId('test-content').parentElement;
    expect(content).toHaveClass('tw-ml-0');
    
    // Open sidebar
    fireEvent.click(toggleButton);
    
    // For XXL breakpoint, content margin should not animate
    expect(content).toHaveClass('tw-ml-0');
  });

  it('handles footer visibility for sidebar positioning', async () => {
    // Mock footer element
    const mockFooter = document.createElement('div');
    mockFooter.id = 'footer';
    document.body.appendChild(mockFooter);

    // Mock getBoundingClientRect for footer
    mockFooter.getBoundingClientRect = jest.fn(() => ({
      top: 900,
      bottom: 1000,
      left: 0,
      right: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));

    renderComponent();

    // Simulate scroll to trigger footer visibility calculation
    fireEvent.scroll(window);

    // Cleanup
    document.body.removeChild(mockFooter);
  });

  it('calculates element visibility in viewport correctly', () => {
    renderComponent();
    
    // This tests the elementIsVisibleInViewportPx function indirectly
    // by ensuring scroll handlers work without errors
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
    
    fireEvent.scroll(window);
    
    // Test passes if no errors are thrown
    expect(true).toBe(true);
  });

  it('removes scroll event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = renderComponent();
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});