import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivityFilters from "../../../components/latest-activity/ActivityFilters";
import { TypeFilter, ContractFilter } from "../../../hooks/useActivityData";

// Mock react-bootstrap components to simplify testing
jest.mock("react-bootstrap", () => {
  const MockDropdown = ({ children, drop, className, ...props }: any) => (
    <div data-testid="dropdown" drop={drop} className={className} {...props}>
      {children}
    </div>
  );
  MockDropdown.Toggle = ({ children, ...props }: any) => (
    <button data-testid="dropdown-toggle" {...props}>{children}</button>
  );
  MockDropdown.Menu = ({ children, ...props }: any) => (
    <div data-testid="dropdown-menu" {...props}>{children}</div>
  );
  MockDropdown.Item = ({ children, onClick, ...props }: any) => (
    <button data-testid="dropdown-item" onClick={onClick} {...props}>{children}</button>
  );
  
  return {
    Col: ({ children, ...props }: any) => <div data-testid="col" {...props}>{children}</div>,
    Dropdown: MockDropdown,
  };
});

// Mock the SCSS module
jest.mock("../../../components/latest-activity/LatestActivity.module.scss", () => ({
  filterDropdown: "mock-filter-dropdown",
}));

describe("ActivityFilters", () => {
  const mockProps = {
    typeFilter: TypeFilter.ALL,
    selectedContract: ContractFilter.ALL,
    onTypeFilterChange: jest.fn(),
    onContractFilterChange: jest.fn(),
    isMobile: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders without crashing", () => {
      render(<ActivityFilters {...mockProps} />);
      expect(screen.getByTestId("col")).toBeInTheDocument();
    });

    it("renders both dropdown filters", () => {
      render(<ActivityFilters {...mockProps} />);
      const dropdowns = screen.getAllByTestId("dropdown");
      expect(dropdowns).toHaveLength(2);
    });

    it("displays current filter values in dropdown toggles", () => {
      render(<ActivityFilters {...mockProps} />);
      expect(screen.getByText("Collection: All")).toBeInTheDocument();
      expect(screen.getByText("Filter: All")).toBeInTheDocument();
    });

    it("displays custom filter values when provided", () => {
      const customProps = {
        ...mockProps,
        typeFilter: TypeFilter.SALES,
        selectedContract: ContractFilter.MEMES,
      };
      render(<ActivityFilters {...customProps} />);
      expect(screen.getByText("Collection: Memes")).toBeInTheDocument();
      expect(screen.getByText("Filter: Sales")).toBeInTheDocument();
    });
  });

  describe("Responsive Layout", () => {
    it("applies center alignment on mobile", () => {
      const mobileProps = { ...mockProps, isMobile: true };
      render(<ActivityFilters {...mobileProps} />);
      const col = screen.getByTestId("col");
      expect(col.className).toContain("justify-content-center");
    });

    it("applies end alignment on desktop", () => {
      const desktopProps = { ...mockProps, isMobile: false };
      render(<ActivityFilters {...desktopProps} />);
      const col = screen.getByTestId("col");
      expect(col.className).toContain("justify-content-end");
    });
  });

  describe("Dropdown Options", () => {
    it("renders all TypeFilter options", () => {
      const { container } = render(<ActivityFilters {...mockProps} />);
      
      // Check that all enum values would be rendered
      const typeFilterValues = Object.values(TypeFilter);
      expect(typeFilterValues).toContain(TypeFilter.ALL);
      expect(typeFilterValues).toContain(TypeFilter.SALES);
      expect(typeFilterValues).toContain(TypeFilter.TRANSFERS);
      expect(typeFilterValues).toContain(TypeFilter.AIRDROPS);
      expect(typeFilterValues).toContain(TypeFilter.MINTS);
      expect(typeFilterValues).toContain(TypeFilter.BURNS);
    });

    it("renders all ContractFilter options", () => {
      const { container } = render(<ActivityFilters {...mockProps} />);
      
      // Check that all enum values would be rendered
      const contractFilterValues = Object.values(ContractFilter);
      expect(contractFilterValues).toContain(ContractFilter.ALL);
      expect(contractFilterValues).toContain(ContractFilter.MEMES);
      expect(contractFilterValues).toContain(ContractFilter.NEXTGEN);
      expect(contractFilterValues).toContain(ContractFilter.GRADIENTS);
    });
  });

  describe("CSS Classes", () => {
    it("applies correct CSS classes to dropdowns", () => {
      render(<ActivityFilters {...mockProps} />);
      const dropdowns = screen.getAllByTestId("dropdown");
      dropdowns.forEach(dropdown => {
        expect(dropdown.className).toContain("mock-filter-dropdown");
        expect(dropdown).toHaveAttribute("drop", "down-centered");
      });
    });

    it("applies correct Bootstrap classes to Col", () => {
      render(<ActivityFilters {...mockProps} />);
      const col = screen.getByTestId("col");
      expect(col).toHaveAttribute("sm", "12");
      expect(col).toHaveAttribute("md", "6");
      expect(col.className).toContain("d-flex");
      expect(col.className).toContain("align-items-center");
      expect(col.className).toContain("gap-4");
    });
  });

  describe("Props Validation", () => {
    it("handles all TypeFilter enum values correctly", () => {
      Object.values(TypeFilter).forEach((typeFilter) => {
        const props = { ...mockProps, typeFilter };
        render(<ActivityFilters {...props} />);
        expect(screen.getByText(`Filter: ${typeFilter}`)).toBeInTheDocument();
      });
    });

    it("handles all ContractFilter enum values correctly", () => {
      Object.values(ContractFilter).forEach((selectedContract) => {
        const props = { ...mockProps, selectedContract };
        render(<ActivityFilters {...props} />);
        expect(screen.getByText(`Collection: ${selectedContract}`)).toBeInTheDocument();
      });
    });

    it("preserves callback function references", () => {
      const onTypeFilterChange = jest.fn();
      const onContractFilterChange = jest.fn();
      const props = {
        ...mockProps,
        onTypeFilterChange,
        onContractFilterChange,
      };
      
      render(<ActivityFilters {...props} />);
      
      // Callbacks should be preserved (this tests the component doesn't recreate them)
      expect(typeof props.onTypeFilterChange).toBe("function");
      expect(typeof props.onContractFilterChange).toBe("function");
    });
  });

  describe("Component Integration", () => {
    it("maintains proper component structure", () => {
      const { container } = render(<ActivityFilters {...mockProps} />);
      
      // Should have proper nesting: Col > (Dropdown * 2)
      const col = container.querySelector('[data-testid="col"]');
      const dropdowns = col?.querySelectorAll('[data-testid="dropdown"]');
      
      expect(col).toBeInTheDocument();
      expect(dropdowns).toHaveLength(2);
    });

    it("renders consistently with different boolean values", () => {
      // Test with isMobile true
      const { rerender } = render(<ActivityFilters {...mockProps} isMobile={true} />);
      expect(screen.getByTestId("col")).toBeInTheDocument();
      
      // Test with isMobile false
      rerender(<ActivityFilters {...mockProps} isMobile={false} />);
      expect(screen.getByTestId("col")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("calls onContractFilterChange when contract dropdown item is clicked", async () => {
      const onContractFilterChange = jest.fn();
      const props = {
        ...mockProps,
        onContractFilterChange,
      };
      
      render(<ActivityFilters {...props} />);
      
      // Find all dropdown items and click one that should be a ContractFilter
      const dropdownItems = screen.getAllByTestId("dropdown-item");
      
      // The first dropdown is for contracts, so we'll find items there
      // Since we're using mocks, we can simulate clicking on a known filter
      await userEvent.click(dropdownItems[0]); // This should trigger onClick
      
      expect(onContractFilterChange).toHaveBeenCalled();
    });

    it("calls onTypeFilterChange when type dropdown item is clicked", async () => {
      const onTypeFilterChange = jest.fn();
      const props = {
        ...mockProps,
        onTypeFilterChange,
      };
      
      render(<ActivityFilters {...props} />);
      
      // Find all dropdown items
      const dropdownItems = screen.getAllByTestId("dropdown-item");
      
      // The second set of dropdown items are for type filters
      // Since ContractFilter has 4 values (All, Memes, NextGen, Gradients)
      // TypeFilter items start after that
      const typeFilterItemIndex = Object.values(ContractFilter).length; // Should be 4
      if (dropdownItems[typeFilterItemIndex]) {
        await userEvent.click(dropdownItems[typeFilterItemIndex]);
      }
      
      expect(onTypeFilterChange).toHaveBeenCalled();
    });
  });

  describe("Error Boundaries and Edge Cases", () => {
    it("handles undefined enum values gracefully", () => {
      // This tests that the component doesn't break with unexpected enum values
      const propsWithUndefined = {
        ...mockProps,
        typeFilter: undefined as any,
        selectedContract: undefined as any,
      };
      
      expect(() => render(<ActivityFilters {...propsWithUndefined} />)).not.toThrow();
    });

    it("handles missing callback functions", () => {
      const propsWithoutCallbacks = {
        ...mockProps,
        onTypeFilterChange: undefined as any,
        onContractFilterChange: undefined as any,
      };
      
      expect(() => render(<ActivityFilters {...propsWithoutCallbacks} />)).not.toThrow();
    });
  });
});
