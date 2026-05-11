import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("framer-motion", () => ({
  m: {
    div: (props: any) => {
      const { children, initial, animate, exit, transition, ...rest } = props;
      void initial;
      void animate;
      void exit;
      void transition;
      return <div {...rest}>{children}</div>;
    },
    span: (props: any) => {
      const { children, animate, transition, ...rest } = props;
      void animate;
      void transition;
      return <span {...rest}>{children}</span>;
    },
  },
  LazyMotion: ({ children }: any) => <>{children}</>,
  domAnimation: {},
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <span data-testid="icon" />,
}));

import DateAccordion from "@/components/common/DateAccordion";

describe("DateAccordion", () => {
  it("shows collapsed content when not expanded, exposes aria attributes, and toggles from the visible title", () => {
    const toggle = jest.fn();
    render(
      <DateAccordion
        title="Title"
        isExpanded={false}
        onToggle={toggle}
        collapsedContent={<span>info</span>}
      >
        <div data-testid="child" />
      </DateAccordion>
    );
    expect(screen.getByText("info")).toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Title/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls");
    fireEvent.click(screen.getByText("Title"));
    expect(toggle).toHaveBeenCalled();
  });

  it("renders children when expanded and links aria-controls to the content region", () => {
    render(
      <DateAccordion
        title="Title"
        isExpanded={true}
        onToggle={() => {}}
        collapsedContent={<span>info</span>}
      >
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

  it("keeps title actions outside the toggle button", () => {
    const toggle = jest.fn();
    const action = jest.fn();
    render(
      <DateAccordion
        title="Title"
        titleActions={
          <button type="button" onClick={action}>
            Help
          </button>
        }
        isExpanded={false}
        onToggle={toggle}
      >
        <div />
      </DateAccordion>
    );

    const toggleButton = screen.getByRole("button", { name: /Title/ });
    const actionButton = screen.getByRole("button", { name: "Help" });

    expect(toggleButton).not.toContainElement(actionButton);

    fireEvent.click(actionButton);
    expect(action).toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();
  });
});
