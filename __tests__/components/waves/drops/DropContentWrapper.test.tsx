import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DropContentWrapper from '@/components/waves/drops/DropContentWrapper';

declare const ResizeObserver: any;

beforeAll(() => {
  (global as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
    configurable: true,
    get() {
      return 1501;
    },
  });
  Object.defineProperty(HTMLDivElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value() {
      return { top: 0 } as DOMRect;
    },
  });
});

describe('DropContentWrapper', () => {
  it('toggles between expand and collapse states', async () => {
    const user = userEvent.setup();
    const scrollSpy = jest.spyOn(window, 'scrollBy').mockImplementation();
    render(<DropContentWrapper>content</DropContentWrapper>);

    // Initial state - show expand button
    expect(screen.getByText('Show full post')).toBeInTheDocument();
    expect(screen.queryByText('Show less')).not.toBeInTheDocument();

    // After clicking expand
    await user.click(screen.getByText('Show full post'));
    expect(screen.queryByText('Show full post')).not.toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();
    expect(scrollSpy).toHaveBeenCalled();

    // After clicking collapse
    await user.click(screen.getByText('Show less'));
    expect(screen.getByText('Show full post')).toBeInTheDocument();
    expect(screen.queryByText('Show less')).not.toBeInTheDocument();
    
    scrollSpy.mockRestore();
  });

  it('handles content below height threshold', () => {
    // Mock scrollHeight to be below 1000px threshold
    Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 500;
      },
    });

    const { container } = render(<DropContentWrapper>Short content</DropContentWrapper>);
    const contentContainer = container.querySelector('.drop-content-container');
    
    // Container should not have should-truncate class for short content
    expect(contentContainer).not.toHaveClass('should-truncate');
    
    // Expand button should not be visible
    const expandButton = container.querySelector('.drop-expand-button');
    expect(expandButton).toBeInTheDocument();
    // The button exists in DOM but is hidden via CSS when should-truncate class is not present

    // Reset to original mock
    Object.defineProperty(HTMLDivElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 1501;
      },
    });
  });

  it('applies correct CSS classes for truncation', () => {
    const { container } = render(<DropContentWrapper>long content</DropContentWrapper>);
    const contentContainer = container.querySelector('.drop-content-container');
    
    // Initially should have should-truncate class for content over 1000px
    expect(contentContainer).toHaveClass('should-truncate');
    expect(contentContainer).toHaveClass('drop-content-container');
  });

  it('toggles expanded CSS class on click', async () => {
    const user = userEvent.setup();
    const { container } = render(<DropContentWrapper>content</DropContentWrapper>);
    const contentContainer = container.querySelector('.drop-content-container');
    const button = screen.getByText('Show full post');

    // Initially not expanded
    expect(contentContainer).not.toHaveClass('expanded');

    // After clicking expand
    await user.click(button);
    expect(contentContainer).toHaveClass('expanded');

    // After clicking collapse
    await user.click(screen.getByText('Show less'));
    expect(contentContainer).not.toHaveClass('expanded');
  });

  it('uses parent container scroll when provided', async () => {
    const user = userEvent.setup();
    let parentScrollTopValue = 0;
    const parentRef = { 
      current: {
        get scrollTop() { return parentScrollTopValue; },
        set scrollTop(value) { parentScrollTopValue = value; }
      } 
    };
    
    const scrollSpy = jest.spyOn(window, 'scrollBy').mockImplementation();
    
    render(
      <DropContentWrapper parentContainerRef={parentRef}>
        content
      </DropContentWrapper>
    );

    await user.click(screen.getByText('Show full post'));
    
    // Wait for setTimeout
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Should NOT use window.scrollBy when parent container is provided
    expect(scrollSpy).not.toHaveBeenCalled();
    
    scrollSpy.mockRestore();
  });

  it('prevents event propagation on button click', async () => {
    const user = userEvent.setup();
    const parentClickHandler = jest.fn();
    
    render(
      <div onClick={parentClickHandler}>
        <DropContentWrapper>content</DropContentWrapper>
      </div>
    );

    await user.click(screen.getByText('Show full post'));
    
    // Parent click handler should not be called due to stopPropagation
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('handles component safety checks', () => {
    // This test verifies the component renders correctly with expected structure
    const { container } = render(<DropContentWrapper>test content</DropContentWrapper>);
    
    const contentContainer = container.querySelector('.drop-content-container');
    const expandButton = container.querySelector('.drop-expand-button button');
    
    expect(contentContainer).toBeInTheDocument();
    expect(expandButton).toBeInTheDocument();
    expect(contentContainer).toHaveClass('should-truncate');
  });

  it('calls scroll behavior on expand', async () => {
    const user = userEvent.setup();
    const scrollSpy = jest.spyOn(window, 'scrollBy').mockImplementation();

    render(<DropContentWrapper>content</DropContentWrapper>);
    
    await user.click(screen.getByText('Show full post'));
    
    // Wait for setTimeout to complete
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Verify that scroll behavior was attempted
    expect(scrollSpy).toHaveBeenCalled();
    
    scrollSpy.mockRestore();
  });
});
