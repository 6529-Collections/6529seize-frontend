import { render, screen } from "@testing-library/react";
import CreateWaveInlineGroupIdentities from "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities";

jest.mock(
  "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch",
  () =>
    function MockGroupCreateIdentitiesSearch(props: {
      readonly selectedWallets: string[];
    }) {
      return (
        <div data-testid="identities-search">
          {props.selectedWallets.join(",")}
        </div>
      );
    }
);

jest.mock(
  "@/components/groups/page/create/config/GroupCreateIdentitySelectedItems",
  () =>
    function MockGroupCreateIdentitySelectedItems() {
      return <div data-testid="selected-identities" />;
    }
);

describe("CreateWaveInlineGroupIdentities", () => {
  it("passes selected identity wallets to the search field", () => {
    render(
      <CreateWaveInlineGroupIdentities
        identities={[
          {
            profile_id: "profile-1",
            handle: "alpha",
            normalised_handle: "alpha",
            primary_wallet: "0xPRIMARY",
            display: "Alpha",
            tdh: 0,
            level: 0,
            cic_rating: 0,
            wallet: "0xAAA1",
            pfp: null,
          },
          {
            profile_id: "profile-2",
            handle: "beta",
            normalised_handle: "beta",
            primary_wallet: "0xPRIMARY",
            display: "Beta",
            tdh: 0,
            level: 0,
            cic_rating: 0,
            wallet: "0xAAA2",
            pfp: null,
          },
        ]}
        onIdentitySelect={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    expect(screen.getByTestId("identities-search")).toHaveTextContent(
      "0xAAA1,0xAAA2"
    );
  });
});
