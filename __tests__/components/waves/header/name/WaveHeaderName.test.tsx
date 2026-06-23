import { render, screen } from "@testing-library/react";
import React from "react";
import WaveHeaderName from "@/components/waves/header/name/WaveHeaderName";

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
  const wave = {
    id: "w1",
    name: "Wave",
    author: { handle: "bob" },
    chat: { scope: { group: { is_direct_message: false } } },
    wave: {},
  } as any;

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
          chat: { scope: { group: { is_direct_message: true } } },
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
          parent_wave: { id: "parent-wave", name: "Parent Wave" },
        }}
      />
    );

    const hierarchy = screen.getByRole("navigation", {
      name: "Wave hierarchy",
    });
    expect(hierarchy).toBeInTheDocument();
    expect(hierarchy).toHaveTextContent(/Subwave of\s*Parent Wave/);
    expect(screen.getByText("Subwave of")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Parent Wave" })).toHaveAttribute(
      "href",
      "/waves/parent-wave"
    );
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
