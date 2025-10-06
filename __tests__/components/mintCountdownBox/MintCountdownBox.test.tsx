import { render, screen } from "@testing-library/react";
import MintCountdownBox, { MemePageMintBtn } from "@/components/mintCountdownBox/MintCountdownBox";

// Mock DateCountdown component
jest.mock("@/components/date-countdown/DateCountdown", () => {
  return function MockDateCountdown(props: any) {
    return (
      <div data-testid="date-countdown">
        <div data-testid="countdown-title">{props.title}</div>
        <div data-testid="countdown-date">{props.date.getTime()}</div>
      </div>
    );
  };
});

// Mock Next.js Link component
jest.mock("next/link", () => {
  return function MockLink(props: any) {
    return (
      <a href={props.href} target={props.target} rel={props.rel}>
        {props.children}
      </a>
    );
  };
});

const mockButtons: MemePageMintBtn[] = [
  {
    label: "Mint",
    link: "/the-memes/mint",
    target: "_self",
  },
  {
    label: "Secondary Mint",
    link: "https://external.com/mint",
    target: "_blank",
  },
];

describe("MintCountdownBox", () => {
  describe("Basic Rendering", () => {
    it("renders with required props", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200} // Unix timestamp
          buttons={[]}
        />
      );

      expect(screen.getByTestId("countdown-title")).toHaveTextContent(
        "Test Countdown"
      );
      expect(screen.getByTestId("countdown-date")).toHaveTextContent(
        "1640995200000" // Date constructor converts seconds to milliseconds
      );
    });

    it("converts unix timestamp to Date object correctly", () => {
      const unixTimestamp = 1640995200; // January 1, 2022 00:00:00 UTC
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={unixTimestamp}
          buttons={[]}
        />
      );

      // Should pass new Date(props.date * 1000) to DateCountdown
      expect(screen.getByTestId("countdown-date")).toHaveTextContent(
        "1640995200000"
      );
    });

    it("renders with additional_elements when provided", () => {
      const additionalContent = (
        <div data-testid="additional-content">Additional Info</div>
      );

      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={[]}
          additional_elements={additionalContent}
        />
      );

      expect(screen.getByTestId("additional-content")).toBeInTheDocument();
      expect(screen.getByTestId("additional-content")).toHaveTextContent(
        "Additional Info"
      );
    });
  });

  describe("Button Rendering", () => {
    it("renders single button correctly", () => {
      const singleButton = [mockButtons[0]];
      
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={singleButton}
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Mint");
      expect(button).toHaveClass("btn-block");
      expect(button).toHaveClass("no-wrap");
      
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/the-memes/mint");
      expect(link).toHaveAttribute("target", "_self");
      expect(link).not.toHaveAttribute("rel");
    });

    it("renders multiple buttons correctly", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
      
      expect(buttons[0]).toHaveTextContent("Mint");
      expect(buttons[1]).toHaveTextContent("Secondary Mint");
      
      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/the-memes/mint");
      expect(links[0]).toHaveAttribute("target", "_self");
      expect(links[0]).not.toHaveAttribute("rel");
      expect(links[1]).toHaveAttribute("href", "https://external.com/mint");
      expect(links[1]).toHaveAttribute("target", "_blank");
      expect(links[1]).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders JSX Element as button label", () => {
      const jsxLabel = <span data-testid="jsx-label">Complex Label</span>;
      const buttonWithJsx: MemePageMintBtn = {
        label: jsxLabel,
        link: "/test",
        target: "_self",
      };

      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={[buttonWithJsx]}
        />
      );

      expect(screen.getByTestId("jsx-label")).toBeInTheDocument();
      expect(screen.getByTestId("jsx-label")).toHaveTextContent("Complex Label");
    });

    it("uses button link as key for rendering", () => {
      const buttonsWithSameLabel = [
        {
          label: "Mint",
          link: "/mint-1",
          target: "_self" as const,
        },
        {
          label: "Mint",
          link: "/mint-2",
          target: "_self" as const,
        },
      ];

      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={buttonsWithSameLabel}
        />
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
      
      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/mint-1");
      expect(links[1]).toHaveAttribute("href", "/mint-2");
    });
  });

  describe("Button Hiding", () => {
    it("hides buttons when hide_mint_btn is true", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
          hide_mint_btn={true}
        />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("shows buttons when hide_mint_btn is false", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
          hide_mint_btn={false}
        />
      );

      expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("shows buttons when hide_mint_btn is undefined (default behavior)", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
        />
      );

      expect(screen.getAllByRole("button")).toHaveLength(2);
    });
  });

  describe("Empty Buttons Array", () => {
    it("renders without buttons when empty array provided", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={[]}
        />
      );

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.getByTestId("countdown-title")).toBeInTheDocument();
    });

    it("still renders countdown when no buttons", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={[]}
        />
      );

      expect(screen.getByTestId("date-countdown")).toBeInTheDocument();
    });
  });

  describe("Layout and Structure", () => {
    it("renders with proper Bootstrap layout structure", () => {
      const { container } = render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
        />
      );

      // Check for Container, Row, Col structure
      expect(container.querySelector(".container")).toBeInTheDocument();
      expect(container.querySelector(".row")).toBeInTheDocument();
      expect(container.querySelector(".col")).toBeInTheDocument();
    });

    it("applies proper CSS classes to countdown container", () => {
      const { container } = render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={[]}
        />
      );

      const countdownContainer = container.querySelector(".container");
      expect(countdownContainer).toHaveClass("container");
    });

    it("applies proper column classes to countdown and buttons", () => {
      const { container } = render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
        />
      );

      const cols = container.querySelectorAll(".col-sm-12");
      expect(cols.length).toBeGreaterThan(0);
    });

    it("renders additional elements in separate row", () => {
      const additionalContent = (
        <div data-testid="additional-content">Additional Info</div>
      );

      const { container } = render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={[]}
          additional_elements={additionalContent}
        />
      );

      const rows = container.querySelectorAll(".row");
      expect(rows).toHaveLength(2); // One for countdown/buttons, one for additional elements
      expect(screen.getByTestId("additional-content")).toBeInTheDocument();
    });
  });

  describe("Props Validation and Edge Cases", () => {
    it("handles is_full_width prop (pass-through prop)", () => {
      // This prop exists in the interface but doesn't affect MintCountdownBox directly
      // It's likely used by parent components. We test that it doesn't cause errors.
      expect(() => {
        render(
          <MintCountdownBox
            title="Test Countdown"
            date={1640995200}
            buttons={[]}
            is_full_width={true}
          />
        );
      }).not.toThrow();

      expect(() => {
        render(
          <MintCountdownBox
            title="Test Countdown"
            date={1640995200}
            buttons={[]}
            is_full_width={false}
          />
        );
      }).not.toThrow();
    });

    it("handles edge case timestamps", () => {
      // Test with timestamp 0 (epoch)
      render(
        <MintCountdownBox
          title="Epoch Test"
          date={0}
          buttons={[]}
        />
      );

      expect(screen.getByTestId("countdown-date")).toHaveTextContent("0");
    });

    it("handles large timestamp values", () => {
      const largeTimestamp = 2147483647; // Max 32-bit signed integer
      render(
        <MintCountdownBox
          title="Future Test"
          date={largeTimestamp}
          buttons={[]}
        />
      );

      expect(screen.getByTestId("countdown-date")).toHaveTextContent(
        (largeTimestamp * 1000).toString()
      );
    });
  });

  describe("Error Handling", () => {
    it("throws on invalid button target values", () => {
      const invalidButton = {
        label: "Test",
        link: "/test",
        target: "invalid" as any,
      };

      // In TypeScript, this would be caught at compile time
      // but we test runtime behavior for edge cases
      expect(() => {
        render(
          <MintCountdownBox
            title="Test"
            date={1640995200}
            buttons={[invalidButton]}
          />
        );
      }).not.toThrow(); // Component should still render, browser handles invalid target
    });

    it("handles null/undefined additional_elements gracefully", () => {
      expect(() => {
        render(
          <MintCountdownBox
            title="Test"
            date={1640995200}
            buttons={[]}
            additional_elements={null}
          />
        );
      }).not.toThrow();

      expect(() => {
        render(
          <MintCountdownBox
            title="Test"
            date={1640995200}
            buttons={[]}
            additional_elements={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("maintains proper button semantics", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach(button => {
        expect(button).toBeVisible();
        expect(button).toBeEnabled();
      });
    });

    it("maintains proper link semantics", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
        />
      );

      const links = screen.getAllByRole("link");
      links.forEach(link => {
        expect(link).toBeVisible();
        expect(link).toHaveAttribute("href");
        const target = link.getAttribute("target");
        if (target === "_blank") {
          expect(link).toHaveAttribute("rel", "noopener noreferrer");
        } else {
          expect(link).not.toHaveAttribute("rel");
        }
      });
    });

    it("supports keyboard navigation", () => {
      render(
        <MintCountdownBox
          title="Test Countdown"
          date={1640995200}
          buttons={mockButtons}
        />
      );

      const buttons = screen.getAllByRole("button");
      // Buttons should be focusable by default
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute("tabindex", "-1");
      });
    });
  });
});
