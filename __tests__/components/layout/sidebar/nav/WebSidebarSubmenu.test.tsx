import WebSidebarSubmenu from "@/components/layout/sidebar/nav/WebSidebarSubmenu";
import type { SidebarSection } from "@/components/navigation/navTypes";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

const TestIcon = () => null;

const section: SidebarSection = {
  key: "tools",
  name: "Tools",
  icon: TestIcon,
  items: [],
  subsections: [
    {
      name: "Other Tools",
      items: [
        { name: "API", href: "/tools/api" },
        { name: "Block Finder", href: "/tools/block-finder" },
      ],
    },
    {
      name: "Open Data",
      items: [
        { name: "Open Data", href: "/open-data" },
        { name: "Network Metrics", href: "/open-data/network-metrics" },
        { name: "Team", href: "/open-data/team" },
      ],
    },
  ],
};

describe("WebSidebarSubmenu", () => {
  it("renders subsection groups with nested items", () => {
    render(
      <WebSidebarSubmenu
        section={section}
        pathname="/open-data/team"
        onClose={jest.fn()}
      />
    );

    expect(screen.getAllByText("Open Data")).toHaveLength(2);
    expect(screen.getByText("Other Tools")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Tools sub-navigation" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "API" })).toBeInTheDocument();
  });

  it("closes after navigation", () => {
    const onClose = jest.fn();

    render(
      <WebSidebarSubmenu
        section={section}
        pathname="/open-data/team"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole("link", { name: "API" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not mark cross-listed discovery links as current", () => {
    render(
      <WebSidebarSubmenu
        section={{
          ...section,
          subsections: [
            {
              name: "Network",
              items: [
                {
                  name: "Definitions",
                  href: "/network/definitions",
                  activatesSection: false,
                },
              ],
            },
          ],
        }}
        pathname="/network/definitions"
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("link", { name: "Definitions" })
    ).not.toHaveAttribute("aria-current");
  });

  it("repeats keyboard focus requests while the same flyout stays open", () => {
    const { rerender } = render(
      <WebSidebarSubmenu
        section={section}
        pathname="/open-data/team"
        onClose={jest.fn()}
        focusRequest={1}
      />
    );

    const firstLink = screen.getByRole("link", { name: "API" });
    expect(firstLink).toHaveFocus();

    firstLink.blur();
    rerender(
      <WebSidebarSubmenu
        section={section}
        pathname="/open-data/team"
        onClose={jest.fn()}
        focusRequest={2}
      />
    );

    expect(firstLink).toHaveFocus();
  });

  it("moves focus to the next sidebar control when tabbing out", () => {
    const sidebar = document.createElement("div");
    sidebar.dataset.sidebarScroll = "true";
    const trigger = document.createElement("button");
    const nextControl = document.createElement("button");
    trigger.textContent = "Open tools";
    nextControl.textContent = "Next control";
    sidebar.append(trigger, nextControl);
    document.body.prepend(sidebar);
    const onClose = jest.fn();

    try {
      render(
        <WebSidebarSubmenu
          section={section}
          pathname="/open-data/team"
          onClose={onClose}
          triggerElement={trigger}
        />
      );

      const links = screen.getAllByRole("link");
      const lastLink = links.at(-1);
      expect(lastLink).toBeDefined();
      lastLink?.focus();
      fireEvent.keyDown(lastLink as HTMLElement, { key: "Tab" });

      expect(nextControl).toHaveFocus();
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      sidebar.remove();
    }
  });
});
