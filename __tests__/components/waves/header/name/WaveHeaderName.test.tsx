import { render, screen } from "@testing-library/react";
import React from "react";
import WaveHeaderName from "@/components/waves/header/name/WaveHeaderName";
import { createMockApiWave } from "@/__tests__/utils/mockFactories";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock(
  "@/components/waves/header/name/WaveHeaderNameEdit",
  () => (props: any) => <div data-testid="edit" />
);

jest.mock("@/helpers/waves/waves.helpers", () => ({
  ...jest.requireActual("@/helpers/waves/waves.helpers"),
  canEditWave: jest.fn(),
}));

const { canEditWave } = require("@/helpers/waves/waves.helpers");

describe("WaveHeaderName", () => {
  const wave = createMockApiWave({
    id: "w1",
    name: "Wave",
    author: { handle: "bob" } as ApiWave["author"],
    chat: {
      scope: { group: { is_direct_message: false } },
    } as ApiWave["chat"],
  });

  it("shows edit button when user can edit", () => {
    (canEditWave as jest.Mock).mockReturnValue(true);
    render(<WaveHeaderName wave={wave} />);
    expect(screen.getByTestId("edit")).toBeInTheDocument();
    expect(screen.getByText("Wave").closest("a")).toHaveAttribute(
      "href",
      "/waves/w1"
    );
  });

  it("hides edit button when cannot edit", () => {
    (canEditWave as jest.Mock).mockReturnValue(false);
    render(<WaveHeaderName wave={wave} />);
    expect(screen.queryByTestId("edit")).toBeNull();
  });

  it("hides edit button for DM waves even when user can edit", () => {
    (canEditWave as jest.Mock).mockReturnValue(true);
    render(
      <WaveHeaderName
        wave={{
          ...wave,
          chat: {
            scope: { group: { is_direct_message: true, is_hidden: false } },
          } as ApiWave["chat"],
        }}
      />
    );
    expect(screen.queryByTestId("edit")).toBeNull();
  });

  it("shows subwave context with parent link", () => {
    (canEditWave as jest.Mock).mockReturnValue(false);
    render(
      <WaveHeaderName
        wave={{
          ...wave,
          name: "Child Wave",
          parent_wave: {
            id: "parent-wave",
            name: "Parent Wave",
          } as NonNullable<ApiWave["parent_wave"]>,
        }}
      />
    );

    const hierarchy = screen.getByRole("navigation", {
      name: "Wave hierarchy",
    });
    expect(hierarchy).toBeInTheDocument();
    expect(hierarchy).toHaveTextContent(/Subwave of\s*Parent Wave/);
    expect(screen.getByText("Subwave of")).toBeInTheDocument();
    const parentLink = screen.getByRole("link", {
      name: "Open parent wave: Parent Wave",
    });
    expect(parentLink).toHaveAttribute(
      "title",
      "Open parent wave: Parent Wave"
    );
    expect(parentLink).toHaveAttribute("href", "/waves/parent-wave");
    expect(screen.getAllByText("Child Wave")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Child Wave" })).toHaveAttribute(
      "href",
      "/waves/w1"
    );
  });

  it("hides subwave hierarchy for root waves", () => {
    (canEditWave as jest.Mock).mockReturnValue(false);
    render(<WaveHeaderName wave={wave} />);

    expect(
      screen.queryByRole("navigation", { name: "Wave hierarchy" })
    ).toBeNull();
    expect(screen.queryByText("Subwave of")).toBeNull();
    expect(screen.queryByText("Parent Wave")).toBeNull();
  });
});
