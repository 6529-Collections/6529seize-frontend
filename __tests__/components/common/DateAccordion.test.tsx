import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span data-testid="icon" />,
}));

import DateAccordion from "@/components/common/DateAccordion";

describe("DateAccordion", () => {
  it("shows collapsed content when not expanded, exposes aria attributes, and triggers toggle", () => {
    const toggle = jest.fn();
    render(
      <DateAccordion
        title="Title"
        isExpanded={false}
        onToggle={toggle}
        collapsedContent={<span>info</span>}>
        <div data-testid="child" />
      </DateAccordion>
    );
    expect(screen.getByText("info")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Title/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls");
    fireEvent.click(button);
    expect(toggle).toHaveBeenCalled();
  });

  it("renders children when expanded and links aria-controls to the content region", () => {
    render(
      <DateAccordion
        title="Title"
        isExpanded={true}
        onToggle={() => {}}
        collapsedContent={<span>info</span>}>
        <div data-testid="child" />
      </DateAccordion>
    );
    const button = screen.getByRole("button", { name: /Title/ });
    expect(button).toHaveAttribute("aria-expanded", "true");
    const controls = button.getAttribute("aria-controls");
    expect(controls).toBeTruthy();
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.queryByText("info")).not.toBeInTheDocument();
    const region = controls ? document.getElementById(controls) : null;
    expect(region).toBeInTheDocument();
    expect(region).toContainElement(screen.getByTestId("child"));
  });
});
