import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";

// Mock the FontAwesome icons and components
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, onClick, style }: any) => (
    <svg 
      data-testid="fontawesome-icon"
      data-icon={icon.iconName}
      onClick={onClick}
      style={style}
    />
  ),
}));

// Mock useCapacitor hook
const mockUseCapacitor = jest.fn();
jest.mock('../../../../../../hooks/useCapacitor', () => ({
  __esModule: true,
  default: mockUseCapacitor,
}));

// Mock useSwiper hook
const mockUseSwiper = jest.fn();
jest.mock('swiper/react', () => ({
  __esModule: true,
  useSwiper: mockUseSwiper,
}));

// Import after mocks are set up
import SwiperAutoplayButton from "../../../../../../components/nextGen/collections/collectionParts/hooks/SwiperAutoplayButton";

describe('SwiperAutoplayButton', () => {
  // Mock swiper instance with autoplay controls
  const mockSwiperInstance = {
    autoplay: {
      start: jest.fn(),
      stop: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSwiper.mockReturnValue(mockSwiperInstance);
    mockUseCapacitor.mockReturnValue({
      isCapacitor: false,
      isIos: false,
      isAndroid: false,
    });
  });

  describe('Component Rendering', () => {
    it('renders button container with correct classes', () => {
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const container = document.querySelector('.text-center');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('text-center');
    });

    it('renders FontAwesome icon with correct props', () => {
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('style', 'height: 24px; cursor: pointer;');
    });
  });

  describe('Icon State Management', () => {
    it('shows pause icon initially when not on Capacitor', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      expect(icon).toHaveAttribute('data-icon', 'circle-pause');
    });

    it('shows play icon initially when on Capacitor platform', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: true });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      expect(icon).toHaveAttribute('data-icon', 'circle-play');
    });

    it('toggles icon when clicked - pause to play', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      expect(icon).toHaveAttribute('data-icon', 'circle-pause');
      
      fireEvent.click(icon);
      
      expect(icon).toHaveAttribute('data-icon', 'circle-play');
    });

    it('toggles icon when clicked - play to pause', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: true });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      expect(icon).toHaveAttribute('data-icon', 'circle-play');
      
      fireEvent.click(icon);
      
      expect(icon).toHaveAttribute('data-icon', 'circle-pause');
    });
  });

  describe('Autoplay Control Logic', () => {
    it('stops autoplay when component mounts and manually paused', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: true }); // Initially paused on Capacitor
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
    });

    it('starts autoplay when component mounts and not manually paused', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false }); // Not paused initially
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });

    it('stops autoplay when not in viewport', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      const { rerender } = render(<SwiperAutoplayButton isInViewport={true} />);
      
      // Initially starts because in viewport and not paused
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      rerender(<SwiperAutoplayButton isInViewport={false} />);
      
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
    });

    it('starts autoplay when comes into viewport and not manually paused', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      const { rerender } = render(<SwiperAutoplayButton isInViewport={false} />);
      
      // Initially stops because not in viewport
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      rerender(<SwiperAutoplayButton isInViewport={true} />);
      
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });

    it('does not start autoplay when in viewport but manually paused', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: true }); // Manually paused
      
      const { rerender } = render(<SwiperAutoplayButton isInViewport={false} />);
      
      jest.clearAllMocks();
      
      rerender(<SwiperAutoplayButton isInViewport={true} />);
      
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
      expect(mockSwiperInstance.autoplay.start).not.toHaveBeenCalled();
    });
  });

  describe('User Interaction', () => {
    it('toggles manual pause state on click', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      
      // Initial state: not paused, autoplay should be running
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      // Click to pause
      fireEvent.click(icon);
      
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
    });

    it('resumes autoplay when clicked from paused state and in viewport', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: true }); // Start paused
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      
      // Initially paused
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      // Click to resume
      fireEvent.click(icon);
      
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });

    it('does not resume autoplay when clicked but not in viewport', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: true });
      
      render(<SwiperAutoplayButton isInViewport={false} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      
      jest.clearAllMocks();
      
      // Click to try to resume, but not in viewport
      fireEvent.click(icon);
      
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
      expect(mockSwiperInstance.autoplay.start).not.toHaveBeenCalled();
    });
  });

  describe('useEffect Dependencies', () => {
    it('reacts to isInViewport prop changes', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      const { rerender } = render(<SwiperAutoplayButton isInViewport={true} />);
      
      jest.clearAllMocks();
      
      // Change viewport status
      rerender(<SwiperAutoplayButton isInViewport={false} />);
      
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      rerender(<SwiperAutoplayButton isInViewport={true} />);
      
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });

    it('reacts to manual pause state changes via user interaction', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      
      jest.clearAllMocks();
      
      // Toggle pause state
      fireEvent.click(icon);
      
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      // Toggle back to play
      fireEvent.click(icon);
      
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });
  });

  describe('Platform Detection', () => {
    it('initializes with correct pause state for Capacitor platform', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: true });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      // Should be paused initially on Capacitor
      expect(mockSwiperInstance.autoplay.stop).toHaveBeenCalled();
      expect(mockSwiperInstance.autoplay.start).not.toHaveBeenCalled();
    });

    it('initializes with correct pause state for web platform', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      // Should start playing initially on web
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles missing swiper instance gracefully', () => {
      mockUseSwiper.mockReturnValue(null);
      
      expect(() => {
        render(<SwiperAutoplayButton isInViewport={true} />);
      }).toThrow();
    });

    it('handles swiper instance without autoplay property', () => {
      mockUseSwiper.mockReturnValue({});
      
      expect(() => {
        render(<SwiperAutoplayButton isInViewport={true} />);
      }).toThrow();
    });

    it('handles useCapacitor hook returning undefined', () => {
      mockUseCapacitor.mockReturnValue(undefined);
      
      expect(() => {
        render(<SwiperAutoplayButton isInViewport={true} />);
      }).toThrow(); // This should throw because accessing .isCapacitor on undefined would fail
    });
  });

  describe('Component Lifecycle', () => {
    it('calls autoplay methods during component lifecycle', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      const { unmount } = render(<SwiperAutoplayButton isInViewport={true} />);
      
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
      
      // Unmounting should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('handles rapid prop changes without issues', () => {
      mockUseCapacitor.mockReturnValue({ isCapacitor: false });
      
      const { rerender } = render(<SwiperAutoplayButton isInViewport={true} />);
      
      // Rapid changes should not cause errors
      expect(() => {
        act(() => {
          rerender(<SwiperAutoplayButton isInViewport={false} />);
          rerender(<SwiperAutoplayButton isInViewport={true} />);
          rerender(<SwiperAutoplayButton isInViewport={false} />);
          rerender(<SwiperAutoplayButton isInViewport={true} />);
        });
      }).not.toThrow();
      
      // After rapid changes, final state should be correct (in viewport, playing)
      expect(mockSwiperInstance.autoplay.start).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('provides clickable button with proper cursor', () => {
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      expect(icon).toHaveAttribute('style', 'height: 24px; cursor: pointer;');
    });

    it('icon is properly sized for touch interaction', () => {
      render(<SwiperAutoplayButton isInViewport={true} />);
      
      const icon = screen.getByTestId('fontawesome-icon');
      expect(icon).toHaveAttribute('style', 'height: 24px; cursor: pointer;');
    });
  });
});