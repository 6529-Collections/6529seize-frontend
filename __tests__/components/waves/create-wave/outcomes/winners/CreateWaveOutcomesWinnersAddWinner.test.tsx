import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveOutcomesWinnersAddWinner from '@/components/waves/create-wave/outcomes/winners/CreateWaveOutcomesWinnersAddWinner';

describe('CreateWaveOutcomesWinnersAddWinner', () => {
  const mockAddWinner = jest.fn();

  const defaultProps = {
    addWinner: mockAddWinner,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(<CreateWaveOutcomesWinnersAddWinner {...defaultProps} {...props} />);
  };

  it('renders the add winner button', () => {
    renderComponent();
    
    const button = screen.getByRole('button', { name: /add winner/i });
    expect(button).toBeInTheDocument();
  });

  it('displays the correct text', () => {
    renderComponent();
    
    expect(screen.getByText('Add winner')).toBeInTheDocument();
  });

  it('calls addWinner when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const button = screen.getByRole('button', { name: /add winner/i });
    await user.click(button);
    
    expect(mockAddWinner).toHaveBeenCalledTimes(1);
  });

  it('calls addWinner multiple times on multiple clicks', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const button = screen.getByRole('button', { name: /add winner/i });
    
    await user.click(button);
    await user.click(button);
    await user.click(button);
    
    expect(mockAddWinner).toHaveBeenCalledTimes(3);
  });

  it('renders with correct CSS classes', () => {
    const { container } = renderComponent();
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('tw-flex', '-tw-ml-2');
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'tw-py-1',
      'tw-px-2',
      'tw-bg-transparent',
      'tw-border-0',
      'tw-flex',
      'tw-items-center',
      'tw-text-sm',
      'tw-text-primary-400',
      'hover:tw-text-primary-300',
      'tw-font-semibold',
      'tw-transition',
      'tw-duration-300',
      'tw-ease-out'
    );
  });

  it('renders the plus icon SVG', () => {
    renderComponent();
    
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('tw-h-5', 'tw-w-5', 'tw-mr-2', 'tw-flex-shrink-0');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('fill', 'none');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the plus icon path with correct attributes', () => {
    renderComponent();
    
    const path = screen.getByRole('button').querySelector('path');
    expect(path).toBeInTheDocument();
    expect(path).toHaveAttribute('d', 'M12 5V19M5 12H19');
    expect(path).toHaveAttribute('stroke', 'currentColor');
    expect(path).toHaveAttribute('stroke-width', '2');
    expect(path).toHaveAttribute('stroke-linecap', 'round');
    expect(path).toHaveAttribute('stroke-linejoin', 'round');
  });

  it('has accessible button structure', () => {
    renderComponent();
    
    const button = screen.getByRole('button', { name: /add winner/i });
    expect(button).toHaveAttribute('type', 'button');
    
    // Check that the text is within a span
    const span = button.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span).toHaveTextContent('Add winner');
  });

  it('button is focusable', () => {
    renderComponent();
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
  });

  it('handles keyboard interaction', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const button = screen.getByRole('button');
    
    // Focus and press Enter
    button.focus();
    await user.keyboard('{Enter}');
    
    expect(mockAddWinner).toHaveBeenCalledTimes(1);
  });

  it('handles space key interaction', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const button = screen.getByRole('button');
    
    // Focus and press Space
    button.focus();
    await user.keyboard(' ');
    
    expect(mockAddWinner).toHaveBeenCalledTimes(1);
  });
});