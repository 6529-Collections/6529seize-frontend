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
    expect(screen.getByRole("menuitem", { name: "Team" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "API" })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("menuitem", { name: "API" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
