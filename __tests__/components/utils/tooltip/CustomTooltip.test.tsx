import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomTooltip from '@/components/utils/tooltip/CustomTooltip';

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('CustomTooltip', () => {
  beforeEach(() => {
    // Create portal root for tests
    const portalRoot = document.createElement('div');
    portalRoot.id = 'custom-tooltip-portal';
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up portal root
    const portalRoot = document.getElementById('custom-tooltip-portal');
    if (portalRoot) {
      document.body.removeChild(portalRoot);
    }
  });

  it('renders children without tooltip initially', () => {
    render(
      <CustomTooltip content="Test tooltip">
        <button>Test Button</button>
      </CustomTooltip>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouse enter after delay', async () => {
    render(
      <CustomTooltip content="Test tooltip" delayShow={100}>
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });
  });

  it('hides tooltip on mouse leave after delay', async () => {
    render(
      <CustomTooltip content="Test tooltip" delayShow={100} delayHide={100}>
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    await waitFor(() => {
      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });

    fireEvent.mouseLeave(button);

    await waitFor(() => {
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });
  });

  it('does not show tooltip when disabled', async () => {
    render(
      <CustomTooltip content="Test tooltip" disabled delayShow={100}>
        <button>Test Button</button>
      </CustomTooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);

    // Wait a bit longer than delayShow to ensure tooltip would have appeared
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
  });

  it('preserves original mouse event handlers', () => {
    const onMouseEnter = jest.fn();
    const onMouseLeave = jest.fn();

    render(
      <CustomTooltip content="Test tooltip" delayShow={100}>
        <button onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
          Test Button
        </button>
      </CustomTooltip>
    );

    const button = screen.getByText('Test Button');
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(onMouseEnter).toHaveBeenCalled();
    expect(onMouseLeave).toHaveBeenCalled();
  });
});