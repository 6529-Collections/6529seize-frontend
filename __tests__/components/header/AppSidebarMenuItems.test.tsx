import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppSidebarMenuItems from "@/components/header/AppSidebarMenuItems";

type MenuItem = React.ComponentProps<
  typeof AppSidebarMenuItems
>["menu"][number];

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));

const {
  useSeizeConnectContext: useCtx,
} = require("@/components/auth/SeizeConnectContext");
const { useIdentity: useId } = require("@/hooks/useIdentity");

afterEach(() => jest.clearAllMocks());

describe("AppSidebarMenuItems", () => {
  const baseMenu: MenuItem[] = [
    { label: "Profile", path: "/profile" },
    { label: "About", path: "/about" },
  ];

  it("filters profile link when not connected", () => {
    (useCtx as jest.Mock).mockReturnValue({ address: undefined });
    (useId as jest.Mock).mockReturnValue({ profile: null });
    render(<AppSidebarMenuItems menu={baseMenu} onNavigate={jest.fn()} />);
    expect(screen.queryByText("Profile")).toBeNull();
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("uses wallet address for profile path", async () => {
    (useCtx as jest.Mock).mockReturnValue({ address: "0xABC" });
    (useId as jest.Mock).mockReturnValue({ profile: null });
    const onNavigate = jest.fn();
    render(<AppSidebarMenuItems menu={baseMenu} onNavigate={onNavigate} />);
    const link = screen.getByRole("link", { name: "Profile" });
    expect(link).toHaveAttribute("href", "/0xabc");
    await userEvent.click(link);
    expect(onNavigate).toHaveBeenCalled();
  });

  it("renders nested section children after group disclosure", async () => {
    (useCtx as jest.Mock).mockReturnValue({ address: "0xABC" });
    (useId as jest.Mock).mockReturnValue({ profile: { handle: "Alice" } });
    const menu: MenuItem[] = [
      {
        label: "More",
        children: [
          {
            label: "Section",
            section: true,
            children: [{ label: "Item", path: "/item" }],
          },
        ],
      },
    ];
    render(<AppSidebarMenuItems menu={menu} onNavigate={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByRole("button", { name: "Section" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Item" })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Section" }));
    expect(screen.getByRole("link", { name: "Item" })).toHaveAttribute(
      "href",
      "/item"
    );
  });

  it("starts nested groups without a divider after the landing link", async () => {
    (useCtx as jest.Mock).mockReturnValue({ address: undefined });
    (useId as jest.Mock).mockReturnValue({ profile: null });
    const menu: MenuItem[] = [
      {
        label: "About",
        children: [
          { label: "About", path: "/about" },
          {
            label: "About 6529",
            section: true,
            children: [{ label: "FAQ", path: "/about/faq" }],
          },
          {
            label: "Legal",
            section: true,
            children: [{ label: "Terms", path: "/about/terms-of-service" }],
          },
        ],
      },
    ];
    const { container } = render(
      <AppSidebarMenuItems menu={menu} onNavigate={jest.fn()} />
    );

    await userEvent.click(screen.getByRole("button", { name: "About" }));

    expect(screen.getByRole("button", { name: "About 6529" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Legal" })).toBeVisible();
    expect(container.querySelectorAll(".tw-h-px.tw-bg-iron-800")).toHaveLength(
      1
    );
  });
});
