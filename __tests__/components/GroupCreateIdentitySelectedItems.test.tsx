import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupCreateIdentitySelectedItems from "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems";

const identities = [
  { wallet: "1", handle: "alice", pfp: undefined },
  { wallet: "2", handle: "bob", pfp: "img" },
];

describe("GroupCreateIdentitySelectedItems", () => {
  it("renders and removes", async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    render(
      <GroupCreateIdentitySelectedItems
        selectedIdentities={identities as any}
        onRemove={onRemove}
      />
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onRemove).toHaveBeenCalledWith("1");
  });

  it("supports the Quick Tag handle prefix and accessible remove label", () => {
    render(
      <GroupCreateIdentitySelectedItems
        selectedIdentities={identities as any}
        onRemove={jest.fn()}
        handlePrefix="@"
        getRemoveLabel={(identity) => `Remove @${identity.handle}`}
      />
    );

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove @alice" })
    ).toBeInTheDocument();
  });
});
