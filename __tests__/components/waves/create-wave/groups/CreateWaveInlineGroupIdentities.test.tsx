import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthContext } from "@/components/auth/Auth";
import CreateWaveInlineGroupIdentities from "@/components/waves/create-wave/groups/CreateWaveInlineGroupIdentities";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { createEmptyInlineGroupWalletSources } from "@/components/waves/create-wave/groups/createWaveInlineGroupBuilder";

jest.mock(
  "@/components/groups/page/create/config/identities/select/GroupCreateIdentitiesSearch",
  () =>
    function MockGroupCreateIdentitiesSearch(props: {
      readonly selectedWallets: string[];
      readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
      readonly label?: string;
      readonly placeholder?: string;
      readonly resultsLayout?: string;
      readonly sort?: string;
    }) {
      return (
        <div
          data-testid="identities-search"
          data-label={props.label}
          data-placeholder={props.placeholder}
          data-results-layout={props.resultsLayout}
          data-sort={props.sort}
        >
          {props.selectedWallets.join(",")}
          <button
            type="button"
            onClick={() =>
              props.onIdentitySelect({
                profile_id: "profile-search",
                handle: "searched",
                normalised_handle: "searched",
                primary_wallet: "0xSEARCH",
                display: "Searched",
                tdh: 0,
                level: 0,
                cic_rating: 0,
                wallet: "0xSEARCH",
                pfp: null,
              })
            }
          >
            Select searched identity
          </button>
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

jest.mock(
  "@/components/waves/create-wave/groups/CreateWaveInlineGroupWalletSources",
  () =>
    function MockCreateWaveInlineGroupWalletSources(props: {
      readonly direction: string;
    }) {
      return <div data-testid="wallet-sources">{props.direction}</div>;
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
  includedIdentities = [],
  excludedIdentities = [],
  onIncludedIdentitySelect = jest.fn(),
  onIncludedIdentityRemove = jest.fn(),
  onExcludedIdentitySelect = jest.fn(),
  onExcludedIdentityRemove = jest.fn(),
  onIncludedWalletSourcesChange = jest.fn(),
  onExcludedWalletSourcesChange = jest.fn(),
  profile = connectedProfile,
}: {
  readonly includedIdentities?: readonly CommunityMemberMinimal[];
  readonly excludedIdentities?: readonly CommunityMemberMinimal[];
  readonly onIncludedIdentitySelect?: jest.Mock;
  readonly onIncludedIdentityRemove?: jest.Mock;
  readonly onExcludedIdentitySelect?: jest.Mock;
  readonly onExcludedIdentityRemove?: jest.Mock;
  readonly onIncludedWalletSourcesChange?: jest.Mock;
  readonly onExcludedWalletSourcesChange?: jest.Mock;
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
        includedIdentities={includedIdentities}
        excludedIdentities={excludedIdentities}
        includedWalletSources={createEmptyInlineGroupWalletSources()}
        excludedWalletSources={createEmptyInlineGroupWalletSources()}
        onIncludedIdentitySelect={onIncludedIdentitySelect}
        onIncludedIdentityRemove={onIncludedIdentityRemove}
        onExcludedIdentitySelect={onExcludedIdentitySelect}
        onExcludedIdentityRemove={onExcludedIdentityRemove}
        onIncludedWalletSourcesChange={onIncludedWalletSourcesChange}
        onExcludedWalletSourcesChange={onExcludedWalletSourcesChange}
        resultsLayout="popover"
      />
    </AuthContext.Provider>
  );

  return {
    onExcludedIdentityRemove,
    onExcludedIdentitySelect,
    onIncludedIdentityRemove,
    onIncludedIdentitySelect,
  };
}

describe("CreateWaveInlineGroupIdentities", () => {
  it("passes selected identity wallets to the search field", () => {
    render(
      <CreateWaveInlineGroupIdentities
        includedIdentities={[
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
        excludedIdentities={[]}
        includedWalletSources={createEmptyInlineGroupWalletSources()}
        excludedWalletSources={createEmptyInlineGroupWalletSources()}
        onIncludedIdentitySelect={jest.fn()}
        onIncludedIdentityRemove={jest.fn()}
        onExcludedIdentitySelect={jest.fn()}
        onExcludedIdentityRemove={jest.fn()}
        onIncludedWalletSourcesChange={jest.fn()}
        onExcludedWalletSourcesChange={jest.fn()}
      />
    );

    expect(screen.getByTestId("identities-search")).toHaveTextContent(
      "0xaaa1,0xaaa2"
    );
    expect(screen.getByTestId("identities-search")).toHaveAttribute(
      "data-results-layout",
      "popover"
    );
    expect(screen.getByTestId("identities-search")).toHaveAttribute(
      "data-sort",
      "level"
    );
  });

  it("passes inline result layout to the search field when requested", () => {
    render(
      <CreateWaveInlineGroupIdentities
        includedIdentities={[]}
        excludedIdentities={[]}
        includedWalletSources={createEmptyInlineGroupWalletSources()}
        excludedWalletSources={createEmptyInlineGroupWalletSources()}
        onIncludedIdentitySelect={jest.fn()}
        onIncludedIdentityRemove={jest.fn()}
        onExcludedIdentitySelect={jest.fn()}
        onExcludedIdentityRemove={jest.fn()}
        onIncludedWalletSourcesChange={jest.fn()}
        onExcludedWalletSourcesChange={jest.fn()}
        resultsLayout="inline"
      />
    );

    expect(screen.getByTestId("identities-search")).toHaveAttribute(
      "data-results-layout",
      "inline"
    );
  });

  it("switches between explicitly included and excluded identities", async () => {
    const user = userEvent.setup();
    renderWithProfile({
      includedIdentities: [selectedCurrentUserIdentity],
      excludedIdentities: [
        { ...selectedCurrentUserIdentity, wallet: "0xEXCLUDED" },
      ],
    });

    expect(screen.getByTestId("identities-search")).toHaveTextContent("0xme");
    expect(screen.getByTestId("identities-search")).toHaveAttribute(
      "data-placeholder",
      "Search identities to include..."
    );
    expect(screen.getByTestId("wallet-sources")).toHaveTextContent("included");

    await user.click(screen.getByRole("button", { name: "Excluded" }));

    expect(screen.getByTestId("identities-search")).toHaveTextContent(
      "0xexcluded"
    );
    expect(screen.getByTestId("identities-search")).toHaveAttribute(
      "data-placeholder",
      "Search identities to exclude..."
    );
    expect(screen.getByTestId("wallet-sources")).toHaveTextContent("excluded");
  });

  it("adds the connected profile when Include me is switched on", async () => {
    const user = userEvent.setup();
    const { onIncludedIdentitySelect } = renderWithProfile();

    await user.click(screen.getByRole("switch", { name: "Include me" }));

    expect(onIncludedIdentitySelect).toHaveBeenCalledWith({
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
      includedIdentities: [selectedCurrentUserIdentity],
    });

    expect(screen.getByRole("switch", { name: "Include me" })).toBeChecked();
  });

  it("places selected identities beside the Include me control", () => {
    renderWithProfile({
      includedIdentities: [selectedCurrentUserIdentity],
    });

    const selectedIdentities = screen.getByTestId("selected-identities");
    const includeMeLabel = screen
      .getByRole("switch", { name: "Include me" })
      .closest("label");

    expect(selectedIdentities.parentElement).toBe(
      includeMeLabel?.parentElement
    );
  });

  it("removes the connected profile when Include me is switched off", async () => {
    const user = userEvent.setup();
    const { onIncludedIdentityRemove } = renderWithProfile({
      includedIdentities: [selectedCurrentUserIdentity],
    });

    await user.click(screen.getByRole("switch", { name: "Include me" }));

    expect(onIncludedIdentityRemove).toHaveBeenCalledWith("0xME");
  });

  it("hides Include me when no connected profile primary wallet exists", () => {
    renderWithProfile({ profile: null });

    expect(
      screen.queryByRole("switch", { name: "Include me" })
    ).not.toBeInTheDocument();
  });

  it("warns when the connected creator is excluded from an identity group", () => {
    renderWithProfile({
      includedIdentities: [
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

    expect(
      screen.getByText(/You are not included in this group/)
    ).toBeInTheDocument();
  });

  it("adds identities to the explicitly excluded list", async () => {
    const user = userEvent.setup();
    const { onExcludedIdentitySelect } = renderWithProfile();

    await user.click(screen.getByRole("button", { name: "Excluded" }));
    await user.click(
      screen.getByRole("button", { name: "Select searched identity" })
    );

    expect(onExcludedIdentitySelect).toHaveBeenCalledWith(
      expect.objectContaining({ wallet: "0xSEARCH" })
    );
  });

  it("warns when the connected creator is explicitly excluded", async () => {
    const user = userEvent.setup();
    renderWithProfile({
      excludedIdentities: [selectedCurrentUserIdentity],
    });

    await user.click(screen.getByRole("button", { name: "Excluded" }));

    expect(
      screen.getByText(/You are not included in this group/)
    ).toBeInTheDocument();
  });
});
