import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CommonDropdown from '../../../../../components/utils/select/dropdown/CommonDropdown';
import { CommonSelectItem } from '../../../../../components/utils/select/CommonSelect';
import { SortDirection } from '../../../../../entities/ISort';

// Mock dependencies
jest.mock('framer-motion', () => ({
  useAnimate: () => [
    { current: document.createElement('div') },
    jest.fn(),
  ],
}));

jest.mock('../../../../../components/utils/select/dropdown/CommonDropdownItemsWrapper', () => {
  return function MockCommonDropdownItemsWrapper({ children, isOpen }: any) {
    return isOpen ? <div data-testid="dropdown-items">{children}</div> : null;
  };
});

jest.mock('../../../../../components/utils/select/dropdown/CommonDropdownItem', () => {
  return function MockCommonDropdownItem({ item, setSelected, children }: any) {
    return (
      <div
        data-testid={`dropdown-item-${item.key}`}
        onClick={() => setSelected(item.value)}
      >
        {item.label}
        {children}
      </div>
    );
  };
});

jest.mock('../../../../../components/user/utils/icons/CommonTableSortIcon', () => {
  return function MockCommonTableSortIcon({ direction, isActive }: any) {
    return (
      <span data-testid="sort-icon">
        {direction}-{isActive ? 'active' : 'inactive'}
      </span>
    );
  };
});

describe('CommonDropdown', () => {
  const mockItems: CommonSelectItem<string>[] = [
    { key: 'item1', label: 'Item 1', value: 'value1' },
    { key: 'item2', label: 'Item 2', value: 'value2', mobileLabel: 'Mobile Item 2' },
    { key: 'item3', label: 'Item 3', value: 'value3' },
  ];

  const defaultProps = {
    items: mockItems,
    activeItem: 'value1',
    filterLabel: 'Test Filter',
    setSelected: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dropdown button with correct label', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should render with mobile label when available', () => {
      const propsWithMobileActive = {
        ...defaultProps,
        activeItem: 'value2',
      };
      
      render(<CommonDropdown {...propsWithMobileActive} />);
      
      expect(screen.getByText('Mobile Item 2')).toBeInTheDocument();
    });

    it('should render with none label when no active item matches', () => {
      const propsWithNoMatch = {
        ...defaultProps,
        activeItem: 'nonexistent',
        noneLabel: 'No Selection',
      };
      
      render(<CommonDropdown {...propsWithNoMatch} />);
      
      expect(screen.getByText('No Selection')).toBeInTheDocument();
    });

    it('should render with default none label when no active item and no custom label', () => {
      const propsWithNoMatch = {
        ...defaultProps,
        activeItem: 'nonexistent',
      };
      
      render(<CommonDropdown {...propsWithNoMatch} />);
      
      expect(screen.getByText('None Selected')).toBeInTheDocument();
    });

    it('should render with correct aria-label', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Test Filter: Item 1');
    });

    it('should render dropdown as closed initially', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      expect(screen.queryByTestId('dropdown-items')).not.toBeInTheDocument();
    });
  });

  describe('dropdown interaction', () => {
    it('should open dropdown when button is clicked', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.getByTestId('dropdown-items')).toBeInTheDocument();
    });

    it('should close dropdown when button is clicked again', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      
      // Open dropdown
      fireEvent.click(button);
      expect(screen.getByTestId('dropdown-items')).toBeInTheDocument();
      
      // Close dropdown
      fireEvent.click(button);
      expect(screen.queryByTestId('dropdown-items')).not.toBeInTheDocument();
    });

    it('should call setSelected when item is selected', () => {
      const mockSetSelected = jest.fn();
      const props = { ...defaultProps, setSelected: mockSetSelected };
      
      render(<CommonDropdown {...props} />);
      
      // Open dropdown
      fireEvent.click(screen.getByRole('button'));
      
      // Select item
      fireEvent.click(screen.getByTestId('dropdown-item-item2'));
      
      expect(mockSetSelected).toHaveBeenCalledWith('value2');
    });

    it('should close dropdown after item selection', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      // Open dropdown
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByTestId('dropdown-items')).toBeInTheDocument();
      
      // Select item
      fireEvent.click(screen.getByTestId('dropdown-item-item2'));
      
      expect(screen.queryByTestId('dropdown-items')).not.toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('should render disabled button when disabled prop is true', () => {
      render(<CommonDropdown {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not open dropdown when disabled', () => {
      render(<CommonDropdown {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(screen.queryByTestId('dropdown-items')).not.toBeInTheDocument();
    });

    it('should apply disabled styling classes', () => {
      render(<CommonDropdown {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('tw-opacity-50', 'tw-text-iron-400');
    });
  });

  describe('theming', () => {
    it('should apply dark theme classes by default', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('tw-bg-iron-800', 'lg:tw-bg-iron-900');
    });

    it('should apply light theme classes when theme is light', () => {
      render(<CommonDropdown {...defaultProps} theme="light" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('tw-bg-iron-800');
      expect(button).not.toHaveClass('lg:tw-bg-iron-900');
    });
  });

  describe('sizing', () => {
    it('should apply medium size padding by default', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('tw-py-3');
    });

    it('should apply small size padding when size is sm', () => {
      render(<CommonDropdown {...defaultProps} size="sm" />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('tw-py-2.5');
    });
  });

  describe('sort direction', () => {
    it('should render sort icon when sortDirection is provided', () => {
      const propsWithSort = {
        ...defaultProps,
        sortDirection: SortDirection.ASC,
      };
      
      render(<CommonDropdown {...propsWithSort} />);
      
      expect(screen.getByTestId('sort-icon')).toBeInTheDocument();
      expect(screen.getByTestId('sort-icon')).toHaveTextContent('ASC-active');
    });

    it('should not render sort icon when sortDirection is not provided', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      expect(screen.queryByTestId('sort-icon')).not.toBeInTheDocument();
    });

    it('should update sort direction when props change', () => {
      const propsWithSort = {
        ...defaultProps,
        sortDirection: SortDirection.ASC,
      };
      
      const { rerender } = render(<CommonDropdown {...propsWithSort} />);
      
      expect(screen.getByTestId('sort-icon')).toHaveTextContent('ASC-active');
      
      rerender(<CommonDropdown {...propsWithSort} sortDirection={SortDirection.DESC} />);
      
      expect(screen.getByTestId('sort-icon')).toHaveTextContent('DESC-active');
    });
  });

  describe('label updates', () => {
    it('should update label when activeItem changes', () => {
      const { rerender } = render(<CommonDropdown {...defaultProps} />);
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      
      rerender(<CommonDropdown {...defaultProps} activeItem="value2" />);
      
      expect(screen.getByText('Mobile Item 2')).toBeInTheDocument();
    });
  });

  describe('render item children', () => {
    it('should render custom children when renderItemChildren is provided', () => {
      const renderItemChildren = jest.fn((item) => (
        <span data-testid={`custom-${item.key}`}>Custom {item.label}</span>
      ));
      
      render(<CommonDropdown {...defaultProps} renderItemChildren={renderItemChildren} />);
      
      // Open dropdown to render items
      fireEvent.click(screen.getByRole('button'));
      
      expect(renderItemChildren).toHaveBeenCalledWith(mockItems[0]);
      expect(renderItemChildren).toHaveBeenCalledWith(mockItems[1]);
      expect(renderItemChildren).toHaveBeenCalledWith(mockItems[2]);
      expect(screen.getByTestId('custom-item1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-item2')).toBeInTheDocument();
      expect(screen.getByTestId('custom-item3')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have aria-hidden on chevron icon', () => {
      render(<CommonDropdown {...defaultProps} />);
      
      const icon = screen.getByRole('button').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      const propsWithNoItems = {
        ...defaultProps,
        items: [],
      };
      
      expect(() => {
        render(<CommonDropdown {...propsWithNoItems} />);
      }).not.toThrow();
    });

    it('should handle missing getBoundingClientRect', () => {
      const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = jest.fn(() => {
        throw new Error('getBoundingClientRect not available');
      });
      
      expect(() => {
        render(<CommonDropdown {...defaultProps} />);
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();
      
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    });
  });
});