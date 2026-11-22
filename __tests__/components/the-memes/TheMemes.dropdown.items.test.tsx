import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import VolumeTypeDropdown from "@/components/the-memes/VolumeTypeDropdown";
import { VolumeType } from "@/entities/INFT";

jest.mock("@headlessui/react", () => ({
  Menu: ({ children }: any) => <div>{children}</div>,
  MenuButton: (p: any) => <button>{p.children}</button>,
  MenuItems: (p: any) => <div>{p.children}</div>,
  MenuItem: (p: any) => {
    const child =
      typeof p.children === "function"
        ? p.children({ focus: false })
        : p.children;
    return React.cloneElement(child, { "data-testid": "item" });
  },
}));

jest.mock("@/components/the-memes/TheMemes.module.css", () => ({}));

describe("VolumeTypeDropdown", () => {
  it("renders all volume type items", () => {
    render(
      <VolumeTypeDropdown
        isVolumeSort={false}
        selectedVolumeSort={VolumeType.ALL_TIME}
        setVolumeType={jest.fn()}
        setVolumeSort={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Volume/ }));
    const items = screen.getAllByTestId("item");
    expect(items).toHaveLength(Object.keys(VolumeType).length);
    Object.values(VolumeType).forEach((v) => {
      expect(screen.getByText(v)).toBeInTheDocument();
    });
  });
});
