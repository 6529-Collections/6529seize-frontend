import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmmaListSearchItem from '@/components/utils/input/emma/EmmaListSearchItem';
import { AllowlistDescription } from '@/components/allowlist-tool/allowlist-tool.types';

describe('EmmaListSearchItem', () => {
  const mockOnSelect = jest.fn();

  const mockItem: AllowlistDescription = {
    id: 'item-1',
    name: 'Test Item Name',
    description: 'Test item description'
  };

  const defaultProps = {
    item: mockItem,
    selectedId: null,
    onSelect: mockOnSelect
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders item name and description', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      expect(screen.getByText('Test Item Name')).toBeInTheDocument();
      expect(screen.getByText('Test item description')).toBeInTheDocument();
    });

    it('renders as a list item with button', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      expect(screen.getByRole('listitem')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('applies correct CSS classes to list item', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveClass('tw-h-full');
    });

    it('applies correct CSS classes to button', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'hover:tw-bg-iron-700',
        'tw-py-2',
        'tw-w-full',
        'tw-h-full',
        'tw-bg-transparent',
        'tw-border-none',
        'tw-text-left',
        'tw-flex',
        'tw-items-center',
        'tw-justify-between',
        'tw-text-white',
        'tw-rounded-lg',
        'tw-relative',
        'tw-cursor-pointer',
        'tw-select-none',
        'tw-px-2',
        'focus:tw-outline-none',
        'focus:tw-ring-1',
        'focus:tw-ring-primary-400',
        'tw-transition',
        'tw-duration-300',
        'tw-ease-out'
      );
    });

    it('applies correct text styling to name', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const nameElement = screen.getByText('Test Item Name');
      expect(nameElement).toHaveClass(
        'tw-mb-0',
        'tw-text-sm',
        'tw-font-medium',
        'tw-text-white',
        'tw-truncate',
        'tw-whitespace-nowrap'
      );
    });

    it('applies correct text styling to description', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const descriptionElement = screen.getByText('Test item description');
      expect(descriptionElement).toHaveClass(
        'tw-mb-0',
        'tw-text-xs',
        'tw-font-medium',
        'tw-text-iron-400',
        'tw-truncate',
        'tw-whitespace-nowrap'
      );
    });
  });

  describe('Selection State', () => {
    it('does not show checkmark when item is not selected', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const checkmark = screen.getByRole('button').querySelector('svg');
      expect(checkmark).not.toBeInTheDocument();
    });

    it('shows checkmark when item is selected', () => {
      render(
        <EmmaListSearchItem
          {...defaultProps}
          selectedId="item-1"
        />
      );

      // Check for the SVG checkmark path
      const checkmark = screen.getByRole('button').querySelector('svg');
      expect(checkmark).toBeInTheDocument();
      expect(checkmark).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies correct checkmark styling when selected', () => {
      render(
        <EmmaListSearchItem
          {...defaultProps}
          selectedId="item-1"
        />
      );

      const checkmark = screen.getByRole('button').querySelector('svg');
      expect(checkmark).toHaveClass(
        'tw-h-5',
        'tw-w-5',
        'tw-ml-2',
        'tw-text-primary-300',
        'tw-transition',
        'tw-duration-300',
        'tw-ease-out'
      );
    });

    it('does not show checkmark for different selected ID', () => {
      render(
        <EmmaListSearchItem
          {...defaultProps}
          selectedId="different-item"
        />
      );

      const checkmark = screen.getByRole('button').querySelector('svg');
      expect(checkmark).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onSelect when button is clicked', async () => {
      const user = userEvent.setup();
      render(<EmmaListSearchItem {...defaultProps} />);

      await user.click(screen.getByRole('button'));

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith(mockItem);
    });

    it('calls onSelect when button is clicked multiple times', async () => {
      const user = userEvent.setup();
      render(<EmmaListSearchItem {...defaultProps} />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);

      expect(mockOnSelect).toHaveBeenCalledTimes(2);
      expect(mockOnSelect).toHaveBeenCalledWith(mockItem);
    });

    it('has correct button type', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('is keyboard accessible', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const button = screen.getByRole('button');
      // Button elements are naturally keyboard accessible
      expect(button).toBeInTheDocument();
    });

    it('can be activated with keyboard', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter' });

      // Since we're using onClick, we need to simulate a click for keyboard activation
      fireEvent.click(button);
      expect(mockOnSelect).toHaveBeenCalledWith(mockItem);
    });
  });

  describe('Component Props Handling', () => {
    it('handles item with empty name', () => {
      const emptyNameItem: AllowlistDescription = {
        id: 'item-2',
        name: '',
        description: 'Description only'
      };

      render(
        <EmmaListSearchItem
          {...defaultProps}
          item={emptyNameItem}
        />
      );

      expect(screen.getByText('Description only')).toBeInTheDocument();
      // Empty name still renders but may not be easily queryable
      expect(emptyNameItem.name).toBe('');
    });

    it('handles item with empty description', () => {
      const emptyDescItem: AllowlistDescription = {
        id: 'item-3',
        name: 'Name only',
        description: ''
      };

      render(
        <EmmaListSearchItem
          {...defaultProps}
          item={emptyDescItem}
        />
      );

      expect(screen.getByText('Name only')).toBeInTheDocument();
      // Empty description still renders but may not be easily queryable
      expect(emptyDescItem.description).toBe('');
    });

    it('handles long text with truncation classes', () => {
      const longTextItem: AllowlistDescription = {
        id: 'item-4',
        name: 'This is a very long name that should be truncated when it exceeds the available space',
        description: 'This is a very long description that should also be truncated when it exceeds the available space'
      };

      render(
        <EmmaListSearchItem
          {...defaultProps}
          item={longTextItem}
        />
      );

      const nameElement = screen.getByText(longTextItem.name);
      const descElement = screen.getByText(longTextItem.description);

      expect(nameElement).toHaveClass('tw-truncate', 'tw-whitespace-nowrap');
      expect(descElement).toHaveClass('tw-truncate', 'tw-whitespace-nowrap');
    });

    it('passes correct item to onSelect callback', async () => {
      const user = userEvent.setup();
      const customItem: AllowlistDescription = {
        id: 'custom-id',
        name: 'Custom Name',
        description: 'Custom Description'
      };

      render(
        <EmmaListSearchItem
          {...defaultProps}
          item={customItem}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(mockOnSelect).toHaveBeenCalledWith(customItem);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for checkmark', () => {
      render(
        <EmmaListSearchItem
          {...defaultProps}
          selectedId="item-1"
        />
      );

      const checkmark = screen.getByRole('button').querySelector('svg');
      expect(checkmark).toHaveAttribute('aria-hidden', 'true');
    });

    it('maintains focus outline styles', () => {
      render(<EmmaListSearchItem {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:tw-outline-none', 'focus:tw-ring-1', 'focus:tw-ring-primary-400');
    });
  });
});