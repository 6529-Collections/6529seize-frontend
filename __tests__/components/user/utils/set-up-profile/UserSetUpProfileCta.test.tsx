import { render, screen } from "@testing-library/react";
import React from "react";
import UserSetUpProfileCta, {
  shouldShowUserSetUpProfileCta,
} from "@/components/user/utils/set-up-profile/UserSetUpProfileCta";
import { AuthContext } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ProfileConnectedStatus } from "@/entities/IProfile";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    readonly href: string;
    readonly children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

type AuthContextValue = React.ContextType<typeof AuthContext>;
type WalletContextForProfileCta = Pick<
  ReturnType<typeof useSeizeConnectContext>,
  "address" | "hasValidWalletAuth"
>;

const defaultAuthContext: AuthContextValue = {
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  showWaves: false,
  sessionUpgradeRequired: false,
  requestAuth: async () => ({ success: false }),
  requestSessionUpgrade: async () => ({ success: false }),
  ensureActiveSessionV2WebSession: async () => false,
  setToast: () => {},
  setActiveProfileProxy: async () => {},
};

const useCtx = useSeizeConnectContext as jest.MockedFunction<
  () => WalletContextForProfileCta
>;

function profileWithHandle(handle: string | null): ApiIdentity {
  return {
    id: "profile-id",
    handle,
    normalised_handle: handle,
    pfp: null,
    cic: 0,
    rep: 0,
    level: 0,
    tdh: 0,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    consolidation_key: "profile-id",
    display: handle ?? "",
    primary_wallet: "0xabc",
    banner1: null,
    banner2: null,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: false,
  };
}

function renderWithProfile(
  profile: AuthContextValue["connectedProfile"],
  authContext: Partial<AuthContextValue> = {}
) {
  return render(
    <AuthContext.Provider
      value={{ ...defaultAuthContext, connectedProfile: profile, ...authContext }}
    >
      <UserSetUpProfileCta />
    </AuthContext.Provider>
  );
}

describe("UserSetUpProfileCta", () => {
  it("shows link when handle missing", () => {
    useCtx.mockReturnValue({ address: "0xabc", hasValidWalletAuth: true });
    renderWithProfile(profileWithHandle(null));
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/0xabc");
  });

  it("shows link when connected wallet has no loaded profile", () => {
    useCtx.mockReturnValue({ address: "0xabc", hasValidWalletAuth: true });
    renderWithProfile(null);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/0xabc");
  });

  it("returns null when address missing or handle exists", () => {
    useCtx.mockReturnValue({ address: null });
    const { container } = renderWithProfile(profileWithHandle(null));
    expect(container.firstChild).toBeNull();

    useCtx.mockReturnValue({ address: "0x1", hasValidWalletAuth: true });
    const { container: c2 } = renderWithProfile(profileWithHandle("h"));
    expect(c2.firstChild).toBeNull();
  });

  it("returns null when wallet auth is invalid", () => {
    useCtx.mockReturnValue({ address: "0x1", hasValidWalletAuth: false });
    const { container } = renderWithProfile(null);
    expect(container.firstChild).toBeNull();
  });

  it("returns null while profile state is loading", () => {
    useCtx.mockReturnValue({ address: "0x1", hasValidWalletAuth: true });
    const { container } = renderWithProfile(null, { fetchingProfile: true });
    expect(container.firstChild).toBeNull();
  });

  it("treats undefined wallet auth as authorized for visibility checks", () => {
    expect(
      shouldShowUserSetUpProfileCta({
        address: "0x1",
        connectedProfileHandle: null,
        fetchingProfile: false,
        hasValidWalletAuth: undefined,
      })
    ).toBe(true);
  });
});
