import { AIRDROPS_USE_CASE } from "@/components/delegation/delegation-constants";
import UserPageSubscriptionsAirdropAddress from "@/components/user/subscriptions/UserPageSubscriptionsAirdropAddress";
import { MEMES_CONTRACT } from "@/constants/constants";
import { fireEvent, render, screen } from "@testing-library/react";

describe("UserPageSubscriptionsAirdropAddress", () => {
  const airdrop = {
    airdrop_address: { address: "0x123", ens: "alice.eth" },
    tdh_wallet: { address: "", ens: "" },
  };

  it("shows address and edit link when allowed", () => {
    render(<UserPageSubscriptionsAirdropAddress show_edit airdrop={airdrop} />);
    expect(screen.getByText("0x123")).toBeInTheDocument();
    expect(screen.getByText(/alice\.eth/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Change airdrop address/i });
    expect(link).toHaveAttribute(
      "href",
      `/safe-collecting/register-delegation?collection=${MEMES_CONTRACT}&use_case=${AIRDROPS_USE_CASE.use_case}`
    );
    expect(link.querySelector("svg")).toBeInTheDocument();
  });

  it("hides edit link when not allowed", () => {
    render(
      <UserPageSubscriptionsAirdropAddress
        show_edit={false}
        airdrop={airdrop}
      />
    );
    expect(
      screen.queryByRole("link", { name: /Change airdrop address/i })
    ).toBeNull();
  });

  it("shows the full visitor address beside its ENS name and in the tooltip", async () => {
    const address = "0x7d88f221e9ecef9eef118e0d0e8a47f81b37e0b6";
    render(
      <UserPageSubscriptionsAirdropAddress
        show_edit={false}
        layout="inline"
        airdrop={{ ...airdrop, airdrop_address: { address, ens: "alice.eth" } }}
      />
    );
    const addressButton = screen.getByRole("button", { name: address });
    expect(addressButton).toHaveTextContent(address);
    fireEvent.focus(addressButton);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(address);
  });
});
