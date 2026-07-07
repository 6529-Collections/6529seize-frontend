import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "@/components/auth/Auth";
import CreateWaveInlineGroupIdentities from "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock(
  "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch",
  () =>
    function MockGroupCreateIdentitiesSearch(props: {
      readonly selectedWallets: string[];
      readonly resultsLayout?: string;
    }) {
      return (
        <div
          data-testid="identities-search"
          data-results-layout={props.resultsLayout}
        >
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

const connectedProfile = {
  id: "profile-me",
  handle: "me",
  normalised_handle: "me",
  primary_wallet: "0xME",
  display: "Me",
  tdh: 42,
  level: 3,
  cic: 5,
  pfp: "me.png",
} as ApiIdentity;

const selectedCurrentUserIdentity: CommunityMemberMinimal = {
  profile_id: "profile-me",
  handle: "me",
  normalised_handle: "me",
  primary_wallet: "0xME",
  display: "Me",
  tdh: 42,
  level: 3,
  cic_rating: 5,
  wallet: "0xme",
  pfp: "me.png",
};

function renderWithProfile({
  identities = [],
  onIdentitySelect = jest.fn(),
  onRemove = jest.fn(),
  profile = connectedProfile,
}: {
  readonly identities?: readonly CommunityMemberMinimal[];
  readonly onIdentitySelect?: jest.Mock;
  readonly onRemove?: jest.Mock;
  readonly profile?: ApiIdentity | null;
} = {}) {
  render(
    <AuthContext.Provider
      value={{
        connectedProfile: profile,
        fetchingProfile: false,
        connectionStatus: ProfileConnectedStatus.HAVE_PROFILE,
        receivedProfileProxies: [],
        activeProfileProxy: null,
        showWaves: false,
        requestAuth: jest.fn().mockResolvedValue({ success: false }),
        setToast: jest.fn(),
        setActiveProfileProxy: jest.fn().mockResolvedValue(undefined),
      }}
    >
      <CreateWaveInlineGroupIdentities
        identities={identities}
        onIdentitySelect={onIdentitySelect}
        onRemove={onRemove}
        resultsLayout="popover"
      />
    </AuthContext.Provider>
  );

  return { onIdentitySelect, onRemove };
}

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
    expect(screen.getByTestId("identities-search")).toHaveAttribute(
      "data-results-layout",
      "popover"
    );
  });

  it("passes inline result layout to the search field when requested", () => {
    render(
      <CreateWaveInlineGroupIdentities
        identities={[]}
        onIdentitySelect={jest.fn()}
        onRemove={jest.fn()}
        resultsLayout="inline"
      />
    );

    expect(screen.getByTestId("identities-search")).toHaveAttribute(
      "data-results-layout",
      "inline"
    );
  });

  it("adds the connected profile when Include me is switched on", async () => {
    const user = userEvent.setup();
    const { onIdentitySelect } = renderWithProfile();

    await user.click(screen.getByRole("switch", { name: "Include me" }));

    expect(onIdentitySelect).toHaveBeenCalledWith({
      profile_id: "profile-me",
      handle: "me",
      normalised_handle: "me",
      primary_wallet: "0xME",
      display: "Me",
      tdh: 42,
      level: 3,
      cic_rating: 5,
      wallet: "0xME",
      pfp: "me.png",
    });
  });

  it("checks Include me when the connected profile is already selected", () => {
    renderWithProfile({
      identities: [selectedCurrentUserIdentity],
    });

    expect(screen.getByRole("switch", { name: "Include me" })).toBeChecked();
  });

  it("removes the connected profile when Include me is switched off", async () => {
    const user = userEvent.setup();
    const { onRemove } = renderWithProfile({
      identities: [selectedCurrentUserIdentity],
    });

    await user.click(screen.getByRole("switch", { name: "Include me" }));

    expect(onRemove).toHaveBeenCalledWith("0xME");
  });

  it("hides Include me when no connected profile primary wallet exists", () => {
    renderWithProfile({ profile: null });

    expect(
      screen.queryByRole("switch", { name: "Include me" })
    ).not.toBeInTheDocument();
  });

  it("warns when the connected creator is excluded from an identity group", () => {
    renderWithProfile({
      identities: [
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
      ],
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      /You are not included in this group/
    );
  });
});
