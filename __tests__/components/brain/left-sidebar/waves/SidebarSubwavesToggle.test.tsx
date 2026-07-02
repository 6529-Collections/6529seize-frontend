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
      knownSubwavesCount={null}
      layoutVariant="app"
      onClick={onClick}
      parentWaveName="Parent Wave"
      showConnector={false}
      unreadDropsCount={0}
      {...props}
    />
  );

  return { onClick };
};

describe("SidebarSubwavesToggle", () => {
  it("renders the collapsed unknown-count label and handles clicks", () => {
    const { onClick } = renderToggle();

    const button = screen.getByRole("button", {
      name: "View Parent Wave subwaves",
    });

    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("View subwaves")).toBeInTheDocument();

    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders known subwave count and unread badge", () => {
    renderToggle({
      knownSubwavesCount: 2,
      unreadDropsCount: 5,
    });

    expect(
      screen.getByRole("button", {
        name: "View 2 subwaves for Parent Wave",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("View 2 subwaves")).toBeInTheDocument();
    expect(screen.getByText("5 new")).toBeInTheDocument();
  });

  it("uses a subtle iron surface while matching unread badge styling", () => {
    renderToggle({
      knownSubwavesCount: 2,
      unreadDropsCount: 5,
    });

    const button = screen.getByRole("button", {
      name: "View 2 subwaves for Parent Wave",
    });
    const unreadBadge = screen.getByText("5 new");
    const wrapper = button.parentElement;

    expect(wrapper).toHaveClass("tw-pl-[74px]");
    expect(wrapper).toHaveClass("md:tw-pl-[70px]");
    expect(wrapper).toHaveClass("tw-pr-5");
    expect(wrapper).toHaveClass("tw-min-h-[42px]");
    expect(wrapper).toHaveClass("tw-pb-2");
    expect(wrapper).not.toHaveClass("tw-px-5");
    expect(button).toHaveClass("tw-h-8");
    expect(button).toHaveClass("tw-rounded-lg");
    expect(button).toHaveClass("tw-border-iron-800");
    expect(button).toHaveClass("tw-bg-iron-950");
    expect(button).toHaveClass("tw-px-3");
    expect(button).toHaveClass("tw-text-xs");
    expect(button).toHaveClass("tw-text-iron-400");
    expect(button).toHaveClass("desktop-hover:hover:tw-border-iron-700");
    expect(button).toHaveClass("desktop-hover:hover:tw-bg-iron-900");
    expect(button).toHaveClass("desktop-hover:hover:tw-text-iron-300");
    expect(button).toHaveClass("focus-visible:tw-outline-primary-400");
    expect(button).not.toHaveClass("tw-bg-primary-500/10");
    expect(unreadBadge).toHaveClass("tw-h-[18px]");
    expect(unreadBadge).toHaveClass("tw-min-w-[18px]");
    expect(unreadBadge).toHaveClass("tw-rounded-full");
    expect(unreadBadge).toHaveClass("tw-bg-indigo-600");
    expect(unreadBadge).toHaveClass("tw-text-[10px]");
  });

  it("renders the loading state", () => {
    const { onClick } = renderToggle({ isLoading: true });

    const button = screen.getByRole("button", {
      name: "Loading Parent Wave subwaves",
    });

    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    expect(screen.getByText("Loading subwaves")).toBeInTheDocument();

    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders the expanded state", () => {
    renderToggle({ isExpanded: true, knownSubwavesCount: 1 });

    const button = screen.getByRole("button", {
      name: "Hide Parent Wave subwaves",
    });
    const wrapper = button.parentElement;

    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(wrapper).toHaveClass("tw-min-h-[38px]");
    expect(wrapper).toHaveClass("tw-pb-1");
    expect(
      screen.getByRole("button", {
        name: "Hide Parent Wave subwaves",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Hide subwaves")).toBeInTheDocument();
  });
});
