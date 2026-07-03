import { printVolumeTypeDropdown } from "@/components/the-memes/TheMemes";
import { VolumeType } from "@/entities/INFT";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@headlessui/react", () => ({
  Menu: (p: any) => <div data-testid="dropdown" {...p} />,
  MenuButton: (p: any) => (
    <button data-testid="toggle" {...p}>
      {p.children}
    </button>
  ),
  MenuItems: (p: any) => <div data-testid="menu" {...p} />,
  MenuItem: (p: any) => {
    const child =
      typeof p.children === "function"
        ? p.children({ focus: false })
        : p.children;
    const label = typeof child === "string" ? child : child.props.children;
    return React.cloneElement(child, {
      "data-testid": `item-${label}`,
      onClick: p.onClick,
    });
  },
}));

jest.mock("@/components/the-memes/TheMemes.module.css", () => ({
  sort: "sort",
  disabled: "disabled",
  volumeDropdown: "volumeDropdown",
  volumeDropdownEnabled: "volumeDropdownEnabled",
}));

describe("TheMemes helpers", () => {
  it("renders volume type options", () => {
    render(printVolumeTypeDropdown(false, jest.fn(), jest.fn()));
    fireEvent.click(screen.getByRole("button", { name: /Volume/ }));
    expect(screen.getByText(VolumeType.ALL_TIME)).toBeInTheDocument();
    expect(screen.getByText(VolumeType.DAYS_7)).toBeInTheDocument();
  });
});
