import { limits } from "@/__tests__/helpers/consolidation-policy.fixture";
import ConsolidationOrderSimulator from "@/app/network/tdh/consolidation/ConsolidationOrderSimulator";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ConsolidationOrderSimulator", () => {
  it("shows that signing with D last never splits the group", async () => {
    const user = userEvent.setup();
    render(
      <ConsolidationOrderSimulator
        limits={limits}
        activationDate="12 October 2026, 00:00 UTC"
        locale="en-US"
      />
    );

    await user.click(screen.getByRole("button", { name: "D signs last" }));

    // The final step is announced along with the verdict.
    expect(screen.getByRole("status")).toHaveTextContent(
      "After D signs, the groups are A + B + C + D. A, B and C together."
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No temporary split. A, B and C stay together"
    );
    expect(screen.getAllByText("A, B and C together")).toHaveLength(4);
    expect(screen.queryByText("Split")).not.toBeInTheDocument();
  });

  it("counts the temporary splits when D signs first", async () => {
    const user = userEvent.setup();
    render(
      <ConsolidationOrderSimulator
        limits={limits}
        activationDate="12 October 2026, 00:00 UTC"
        locale="en-US"
      />
    );

    await user.click(screen.getByRole("button", { name: "D signs first" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "The group split in 2 of 4 steps before D joined."
    );
    expect(screen.getAllByText("Split")).toHaveLength(2);
    expect(screen.getByText("Groups: A + D and B + C")).toBeInTheDocument();
    expect(
      screen.getByText("Signing order so far: D, A, B, C")
    ).toBeInTheDocument();
  });

  it("builds an order one signer at a time and can start again", async () => {
    const user = userEvent.setup();
    render(
      <ConsolidationOrderSimulator
        limits={limits}
        activationDate="12 October 2026, 00:00 UTC"
        locale="en-US"
      />
    );

    const picker = screen.getByRole("group", {
      name: "Choose the next wallet to sign",
    });
    await user.click(
      within(picker).getByRole("button", { name: "Wallet A: one link to D" })
    );

    expect(screen.getByText(/Signing order so far: A/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "After A signs, the groups are A + B + C and D. A, B and C together."
    );
    expect(
      within(picker).queryByRole("button", { name: "Wallet A: one link to D" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start again" }));
    expect(screen.getByText("Signing order so far: none")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start again" })).toBeDisabled();
  });
});

test("does not simulate groups before backend limits are available", () => {
  render(
    <ConsolidationOrderSimulator
      locale="en-US"
      activationDate="pending"
      limits={null}
    />
  );
  expect(
    screen.queryByRole("button", { name: "D signs last" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Wallet limits are loading"
  );
});

test("explains the hidden walkthrough when the limits do not match its four-wallet scenario", () => {
  render(
    <ConsolidationOrderSimulator
      locale="en-US"
      activationDate="12 October 2026, 00:00 UTC"
      limits={{ maxWallets: 5, ungatedMaxWallets: 4 }}
    />
  );
  expect(
    screen.queryByRole("button", { name: "D signs last" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      /This walkthrough shows a fourth wallet joining a group of three/
    )
  ).toBeInTheDocument();
});
