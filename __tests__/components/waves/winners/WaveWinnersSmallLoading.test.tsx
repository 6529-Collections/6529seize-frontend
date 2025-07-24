import { render } from '@testing-library/react';
import { WaveWinnersSmallLoading } from '../../../../components/waves/winners/WaveWinnersSmallLoading';

describe('WaveWinnersSmallLoading', () => {
  it('renders the loading skeleton structure', () => {
    render(<WaveWinnersSmallLoading />);

    // Check that the main container exists
    const container = document.querySelector('.tw-p-3');
    expect(container).toBeInTheDocument();
  });

  it('has correct CSS classes for styling', () => {
    render(<WaveWinnersSmallLoading />);

    // Check for main container styling
    const container = document.querySelector('.tw-p-3');
    expect(container).toHaveClass('tw-p-3');

    // Check for animate-pulse container
    const animateContainer = document.querySelector('.tw-animate-pulse');
    expect(animateContainer).toBeInTheDocument();
    expect(animateContainer).toHaveClass('tw-animate-pulse', 'tw-space-y-4');
  });

  it('renders header skeleton element', () => {
    render(<WaveWinnersSmallLoading />);

    // Check for header skeleton (1/3 width, height 6)
    const headerSkeleton = document.querySelector('.tw-h-6.tw-bg-iron-800.tw-rounded-md.tw-w-1\\/3');
    expect(headerSkeleton).toBeInTheDocument();
    expect(headerSkeleton).toHaveClass(
      'tw-h-6',
      'tw-bg-iron-800',
      'tw-rounded-md',
      'tw-w-1/3'
    );
  });

  it('renders content skeleton elements', () => {
    render(<WaveWinnersSmallLoading />);

    // Check for content container
    const contentContainer = document.querySelector('.tw-space-y-3');
    expect(contentContainer).toBeInTheDocument();
    expect(contentContainer).toHaveClass('tw-space-y-3');

    // Check for content skeleton elements (height 24)
    const contentSkeletons = document.querySelectorAll('.tw-h-24.tw-bg-iron-800.tw-rounded-xl');
    expect(contentSkeletons).toHaveLength(2);

    contentSkeletons.forEach((skeleton) => {
      expect(skeleton).toHaveClass(
        'tw-h-24',
        'tw-bg-iron-800',
        'tw-rounded-xl'
      );
    });
  });

  it('maintains consistent styling structure', () => {
    render(<WaveWinnersSmallLoading />);

    // Test the complete structure
    const mainContainer = document.querySelector('.tw-p-3');
    const animateContainer = mainContainer?.querySelector('.tw-animate-pulse.tw-space-y-4');
    const header = animateContainer?.querySelector('.tw-h-6.tw-bg-iron-800.tw-rounded-md.tw-w-1\\/3');
    const contentContainer = animateContainer?.querySelector('.tw-space-y-3');
    const contentItems = contentContainer?.querySelectorAll('.tw-h-24.tw-bg-iron-800.tw-rounded-xl');

    expect(mainContainer).toBeInTheDocument();
    expect(animateContainer).toBeInTheDocument();
    expect(header).toBeInTheDocument();
    expect(contentContainer).toBeInTheDocument();
    expect(contentItems).toHaveLength(2);
  });

  it('is a functional component that renders without props', () => {
    // Should render without any props required
    expect(() => render(<WaveWinnersSmallLoading />)).not.toThrow();
  });

  it('renders consistently on multiple renders', () => {
    const { rerender } = render(<WaveWinnersSmallLoading />);

    // First render check
    expect(document.querySelectorAll('.tw-h-24.tw-bg-iron-800.tw-rounded-xl')).toHaveLength(2);

    // Re-render and check consistency
    rerender(<WaveWinnersSmallLoading />);
    expect(document.querySelectorAll('.tw-h-24.tw-bg-iron-800.tw-rounded-xl')).toHaveLength(2);

    // Third render
    rerender(<WaveWinnersSmallLoading />);
    expect(document.querySelectorAll('.tw-h-24.tw-bg-iron-800.tw-rounded-xl')).toHaveLength(2);
  });

  it('uses appropriate semantic structure', () => {
    render(<WaveWinnersSmallLoading />);

    // All elements should be divs for skeleton loading
    const allElements = document.querySelectorAll('div');
    expect(allElements.length).toBeGreaterThan(0);

    // No semantic elements like headings, lists, etc. should be present
    expect(document.querySelector('h1, h2, h3, h4, h5, h6')).not.toBeInTheDocument();
    expect(document.querySelector('ul, ol, li')).not.toBeInTheDocument();
    expect(document.querySelector('button, a')).not.toBeInTheDocument();
  });

  it('has proper loading animation class', () => {
    render(<WaveWinnersSmallLoading />);

    const animatedElement = document.querySelector('.tw-animate-pulse');
    expect(animatedElement).toBeInTheDocument();
    
    // The animate-pulse class should be present for loading indication
    expect(animatedElement).toHaveClass('tw-animate-pulse');
  });

  it('maintains correct spacing between elements', () => {
    render(<WaveWinnersSmallLoading />);

    // Check spacing classes
    const mainSpacing = document.querySelector('.tw-space-y-4');
    const contentSpacing = document.querySelector('.tw-space-y-3');

    expect(mainSpacing).toBeInTheDocument();
    expect(mainSpacing).toHaveClass('tw-space-y-4');
    
    expect(contentSpacing).toBeInTheDocument();
    expect(contentSpacing).toHaveClass('tw-space-y-3');
  });

  it('uses consistent color scheme', () => {
    render(<WaveWinnersSmallLoading />);

    // All skeleton elements should use iron-800 background
    const skeletonElements = document.querySelectorAll('.tw-bg-iron-800');
    expect(skeletonElements.length).toBe(3); // header + 2 content items
    
    skeletonElements.forEach((element) => {
      expect(element).toHaveClass('tw-bg-iron-800');
    });
  });

  it('has appropriate border radius for different skeleton types', () => {
    render(<WaveWinnersSmallLoading />);

    // Header should have medium border radius
    const header = document.querySelector('.tw-rounded-md');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('tw-rounded-md');

    // Content items should have larger border radius
    const contentItems = document.querySelectorAll('.tw-rounded-xl');
    expect(contentItems).toHaveLength(2);
    
    contentItems.forEach((item) => {
      expect(item).toHaveClass('tw-rounded-xl');
    });
  });
});