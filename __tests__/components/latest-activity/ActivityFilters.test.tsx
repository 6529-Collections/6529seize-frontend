import ActivityFilters from "@/components/latest-activity/ActivityFilters";
import { ContractFilter, TypeFilter } from "@/hooks/useActivityData";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("react-bootstrap", () => ({
  Col: ({ children, sm, md, className }: any) => (
    <div data-testid="col" data-sm={sm} data-md={md} className={className}>
      {children}
    </div>
  ),
}));

jest.mock("framer-motion", () => ({
  useAnimate: () => [{ current: null }, jest.fn()],
  AnimatePresence: ({ children }: any) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
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
      expect(
        screen.getByRole("button", { name: /Collection:/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Filter:/i })
      ).toBeInTheDocument();
    });

    it("displays current filter values in dropdown buttons", () => {
      render(<ActivityFilters {...mockProps} />);
      expect(
        screen.getByRole("button", {
          name: `Collection: ${ContractFilter.ALL}`,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: `Filter: ${TypeFilter.ALL}` })
      ).toBeInTheDocument();
    });

    it("displays custom filter values when provided", () => {
      const customProps = {
        ...mockProps,
        typeFilter: TypeFilter.SALES,
        selectedContract: ContractFilter.MEMES,
      };
      render(<ActivityFilters {...customProps} />);
      expect(
        screen.getByRole("button", {
          name: `Collection: ${ContractFilter.MEMES}`,
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: `Filter: ${TypeFilter.SALES}` })
      ).toBeInTheDocument();
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

  describe("CSS Classes", () => {
    it("applies correct Bootstrap classes to Col", () => {
      render(<ActivityFilters {...mockProps} />);
      const col = screen.getByTestId("col");
      expect(col).toHaveAttribute("data-sm", "12");
      expect(col).toHaveAttribute("data-md", "6");
      expect(col.className).toContain("d-flex");
      expect(col.className).toContain("align-items-center");
      expect(col.className).toContain("gap-4");
    });

    it("applies tailwind-scope class to Col", () => {
      render(<ActivityFilters {...mockProps} />);
      const col = screen.getByTestId("col");
      expect(col.className).toContain("tailwind-scope");
    });
  });

  describe("Props Validation", () => {
    it("handles all TypeFilter enum values correctly", () => {
      for (const typeFilter of Object.values(TypeFilter)) {
        const props = { ...mockProps, typeFilter };
        const { unmount } = render(<ActivityFilters {...props} />);
        expect(
          screen.getByRole("button", { name: `Filter: ${typeFilter}` })
        ).toBeInTheDocument();
        unmount();
      }
    });

    it("handles all ContractFilter enum values correctly", () => {
      for (const selectedContract of Object.values(ContractFilter)) {
        const props = { ...mockProps, selectedContract };
        const { unmount } = render(<ActivityFilters {...props} />);
        expect(
          screen.getByRole("button", {
            name: `Collection: ${selectedContract}`,
          })
        ).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe("User Interactions", () => {
    it("opens contract dropdown when clicked", async () => {
      const user = userEvent.setup();
      render(<ActivityFilters {...mockProps} />);

      const contractButton = screen.getByRole("button", {
        name: `Collection: ${ContractFilter.ALL}`,
      });
      await user.click(contractButton);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it("opens type filter dropdown when clicked", async () => {
      const user = userEvent.setup();
      render(<ActivityFilters {...mockProps} />);

      const typeButton = screen.getByRole("button", {
        name: `Filter: ${TypeFilter.ALL}`,
      });
      await user.click(typeButton);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it("calls onContractFilterChange when contract option is selected", async () => {
      const user = userEvent.setup();
      const onContractFilterChange = jest.fn();
      render(
        <ActivityFilters
          {...mockProps}
          onContractFilterChange={onContractFilterChange}
        />
      );

      const contractButton = screen.getByRole("button", {
        name: `Collection: ${ContractFilter.ALL}`,
      });
      await user.click(contractButton);

      const memesOption = screen.getByRole("menuitem", {
        name: ContractFilter.MEMES,
      });
      await user.click(memesOption);

      expect(onContractFilterChange).toHaveBeenCalledWith(ContractFilter.MEMES);
    });

    it("calls onTypeFilterChange when type option is selected", async () => {
      const user = userEvent.setup();
      const onTypeFilterChange = jest.fn();
      render(
        <ActivityFilters
          {...mockProps}
          onTypeFilterChange={onTypeFilterChange}
        />
      );

      const typeButton = screen.getByRole("button", {
        name: `Filter: ${TypeFilter.ALL}`,
      });
      await user.click(typeButton);

      const salesOption = screen.getByRole("menuitem", {
        name: TypeFilter.SALES,
      });
      await user.click(salesOption);

      expect(onTypeFilterChange).toHaveBeenCalledWith(TypeFilter.SALES);
    });

    it("shows all ContractFilter options in dropdown", async () => {
      const user = userEvent.setup();
      render(<ActivityFilters {...mockProps} />);

      const contractButton = screen.getByRole("button", {
        name: `Collection: ${ContractFilter.ALL}`,
      });
      await user.click(contractButton);

      for (const contract of Object.values(ContractFilter)) {
        expect(
          screen.getByRole("menuitem", { name: contract })
        ).toBeInTheDocument();
      }
    });

    it("shows all TypeFilter options in dropdown", async () => {
      const user = userEvent.setup();
      render(<ActivityFilters {...mockProps} />);

      const typeButton = screen.getByRole("button", {
        name: `Filter: ${TypeFilter.ALL}`,
      });
      await user.click(typeButton);

      for (const type of Object.values(TypeFilter)) {
        expect(
          screen.getByRole("menuitem", { name: type })
        ).toBeInTheDocument();
      }
    });
  });

  describe("Component Integration", () => {
    it("maintains proper component structure", () => {
      const { container } = render(<ActivityFilters {...mockProps} />);

      const col = container.querySelector('[data-testid="col"]');
      expect(col).toBeInTheDocument();

      const buttons = within(col as HTMLElement).getAllByRole("button", {
        name: /Collection:|Filter:/i,
      });
      expect(buttons).toHaveLength(2);
    });

    it("renders consistently with different boolean values", () => {
      const { rerender } = render(
        <ActivityFilters {...mockProps} isMobile={true} />
      );
      expect(screen.getByTestId("col")).toBeInTheDocument();

      rerender(<ActivityFilters {...mockProps} isMobile={false} />);
      expect(screen.getByTestId("col")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("dropdown buttons have correct aria-haspopup attribute", () => {
      render(<ActivityFilters {...mockProps} />);

      const buttons = screen.getAllByRole("button", {
        name: /Collection:|Filter:/i,
      });
      for (const button of buttons) {
        expect(button).toHaveAttribute("aria-haspopup", "true");
      }
    });

    it("dropdown buttons have correct aria-expanded attribute", async () => {
      const user = userEvent.setup();
      render(<ActivityFilters {...mockProps} />);

      const contractButton = screen.getByRole("button", {
        name: `Collection: ${ContractFilter.ALL}`,
      });
      expect(contractButton).toHaveAttribute("aria-expanded", "false");

      await user.click(contractButton);
      expect(contractButton).toHaveAttribute("aria-expanded", "true");
    });

    it("dropdown items have correct role", async () => {
      const user = userEvent.setup();
      render(<ActivityFilters {...mockProps} />);

      const contractButton = screen.getByRole("button", {
        name: `Collection: ${ContractFilter.ALL}`,
      });
      await user.click(contractButton);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems.length).toBe(Object.values(ContractFilter).length);
    });
  });
});
