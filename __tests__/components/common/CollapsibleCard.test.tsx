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

import CollapsibleCard from "@/components/common/CollapsibleCard";

describe("CollapsibleCard", () => {
  it("shows collapsed content when not expanded, exposes aria attributes, and toggles from the visible title", () => {
    const toggle = jest.fn();
    render(
      <CollapsibleCard
        title="Title"
        isExpanded={false}
        onToggle={toggle}
        collapsedContent={<span>info</span>}
      >
        <div data-testid="child" />
      </CollapsibleCard>
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
      <CollapsibleCard
        title="Title"
        isExpanded={true}
        onToggle={() => {}}
        collapsedContent={<span>info</span>}
      >
        <div data-testid="child" />
      </CollapsibleCard>
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

  it("renders presentational title actions inside the single toggle button", () => {
    const toggle = jest.fn();
    render(
      <CollapsibleCard
        title="Title"
        titleActions={<span>Badge</span>}
        isExpanded={false}
        onToggle={toggle}
      >
        <div />
      </CollapsibleCard>
    );

    const button = screen.getByRole("button", { name: /Title/ });
    const badge = screen.getByText("Badge");

    // The whole header — badge included — is one toggle target.
    expect(button).toContainElement(badge);
    fireEvent.click(badge);
    expect(toggle).toHaveBeenCalled();
  });
});
