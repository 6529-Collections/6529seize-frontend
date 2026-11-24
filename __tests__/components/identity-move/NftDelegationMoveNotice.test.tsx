import NftDelegationMoveNotice from "@/components/identity-move/NftDelegationMoveNotice";
import { NextGenMintingFor } from "@/components/nextGen/collections/collectionParts/mint/NextGenMintShared";
import { setIdentityFreezeAt } from "@/__tests__/helpers/identityFreeze";
import { DelegationCenterSection } from "@/types/enums";
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        NEXT_PUBLIC_IDENTITY_FREEZE_AT: (
          globalThis as { __identityFreezeAt?: string }
        ).__identityFreezeAt,
      };
    },
  };
});
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: ComponentProps<"img">) => <img {...props} alt="" />,
}));
jest.mock(
  "@/components/delegation/safe-collecting/SafeCollecting",
  () => () => <div data-testid="center" />
);
jest.mock(
  "@/components/delegation/consolidation-builder/ConsolidationBuilder",
  () => () => <div data-testid="builder" />
);
jest.mock("@/components/delegation/walletChecker/WalletChecker", () => () => (
  <div />
));
jest.mock("@/components/delegation/html/DelegationHTML", () => () => (
  <div data-testid="delegation-html" />
));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: "0xabc",
    isSafeWallet: false,
    isWalletConnectionPending: false,
    isConnected: true,
    seizeConnect: jest.fn(),
  }),
}));
jest.mock("wagmi", () => ({ useEnsName: () => ({ data: null }) }));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ asPath: "/safe-collecting" }),
  usePathname: () => "/safe-collecting",
}));

const FREEZE = Date.UTC(2026, 10, 24, 0, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

// The owner's wording, word for word.
const NOTICE =
  "From Tuesday 24 November 00:00 UTC, new delegations and consolidations on NFTDelegation don't count for 6529. Your delegations and consolidations as of that time moved to the 6529 Network. Make changes there, on this site.";
const NEXTGEN =
  "NextGen mints still read delegations from NFTDelegation, not from the 6529 Network.";

const menuProps = {
  path: [],
  setActiveSection: jest.fn(),
  address_query: "",
  setAddressQuery: jest.fn(),
  collection_query: "",
  setCollectionQuery: jest.fn(),
  use_case_query: 0,
  setUseCaseQuery: jest.fn(),
};

const renderMintingFor = () =>
  render(
    <NextGenMintingFor
      title="Mint For"
      delegators={["0xdef"]}
      mintForAddress=""
      setMintForAddress={jest.fn()}
    />
  );

beforeEach(() => {
  jest.useFakeTimers();
  setIdentityFreezeAt("2026-11-24T00:00:00Z");
});

afterEach(() => {
  jest.useRealTimers();
  setIdentityFreezeAt(undefined);
});

describe("the NFTDelegation notice", () => {
  it("renders nothing without a freeze", () => {
    setIdentityFreezeAt(undefined);
    jest.setSystemTime(FREEZE - DAY);
    const { container } = render(<NftDelegationMoveNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each([FREEZE - DAY, FREEZE + 1, FREEZE + DAY * 3])(
    "gives the owner's wording at %p",
    (now) => {
      jest.setSystemTime(now);
      render(<NftDelegationMoveNotice />);
      expect(
        screen.getByRole("region", {
          name: "NFTDelegation and the 6529 Network",
        })
      ).toHaveTextContent(NOTICE);
    }
  );

  it.each([
    DelegationCenterSection.CENTER,
    DelegationCenterSection.BUILD_CONSOLIDATION,
    DelegationCenterSection.FAQ,
  ])("shows in the Delegation Center on %s", async (section) => {
    jest.setSystemTime(FREEZE - DAY);
    const { default: Menu } =
      await import("@/components/delegation/DelegationCenterMenu");
    render(<Menu {...menuProps} section={section} />);
    expect(screen.getByTestId("nft-delegation-move-notice")).toHaveTextContent(
      NOTICE
    );
  });
});

describe("the NextGen mint line", () => {
  it("says NextGen mints still use NFTDelegation", () => {
    jest.setSystemTime(FREEZE + DAY * 2);
    renderMintingFor();
    expect(screen.getByText(NEXTGEN)).toBeInTheDocument();
  });

  it("stays away without a freeze", () => {
    setIdentityFreezeAt(undefined);
    renderMintingFor();
    expect(screen.queryByText(NEXTGEN)).not.toBeInTheDocument();
  });
});
