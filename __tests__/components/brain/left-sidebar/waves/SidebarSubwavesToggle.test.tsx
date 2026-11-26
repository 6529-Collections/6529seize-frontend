import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { SidebarSubwavesToggle } from "@/components/brain/left-sidebar/waves/SidebarSubwavesToggle";

const renderToggle = (
  props: Partial<ComponentProps<typeof SidebarSubwavesToggle>> = {}
) => {
  const onClick = jest.fn();
  render(
    <SidebarSubwavesToggle
      isExpanded={false}
      isLoading={false}
      onClick={onClick}
      parentWaveName="Parent Wave"
      unreadDropsCount={0}
      {...props}
    />
  );

  return { onClick };
};

describe("SidebarSubwavesToggle", () => {
  it("shows a right-pointing chevron in the collapsed state", () => {
    const { onClick } = renderToggle();
    const button = screen.getByRole("button", {
      name: "Expand Parent Wave subwaves",
      expanded: false,
    });

    expect(button).toHaveTextContent(/^$/);
    expect(button.querySelector("svg")).not.toHaveClass("tw-rotate-90");
    expect(button.querySelector(".tw-bg-primary-400")).toBeNull();
    expect(button).toHaveClass("touch-only:tw-size-11");
    expect(button).toHaveClass("focus-visible:tw-outline-primary-400");

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows an unnumbered dot for unread collapsed subwaves and keeps the count on hover", () => {
    renderToggle({ unreadDropsCount: 101 });
    const button = screen.getByRole("button", {
      name: "Expand Parent Wave subwaves",
    });

    const dot = button.querySelector(".tw-bg-primary-400");
    expect(dot).toHaveClass("tw-size-1.5", "tw-rounded-full");
    expect(dot).toBeEmptyDOMElement();
    expect(button).toHaveAttribute("title", "99+ new in subwaves");
    expect(button).toHaveAccessibleDescription("99+ new in subwaves");
    expect(screen.getByText("99+ new in subwaves")).toHaveClass("tw-sr-only");
    expect(screen.queryByText("99+", { exact: true })).not.toBeInTheDocument();
  });

  it("keeps the busy control focusable while loading", () => {
    const { onClick } = renderToggle({ isLoading: true });
    const button = screen.getByRole("button", {
      name: "Loading Parent Wave subwaves",
    });

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("points down and can collapse when the list is expanded", () => {
    const { onClick } = renderToggle({ isExpanded: true, unreadDropsCount: 3 });
    const button = screen.getByRole("button", {
      name: "Collapse Parent Wave subwaves",
      expanded: true,
    });

    expect(button.querySelector("svg")).toHaveClass("tw-rotate-90");
    expect(button.querySelector(".tw-bg-primary-400")).toBeNull();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
