import ManifoldMinting from "@/components/manifold-minting/ManifoldMinting";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseManifoldClaim = jest.fn();

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img alt={props.alt ?? ""} {...props} />,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@reown/appkit/react", () => ({
  AppKitButton: () => <div data-testid="appkit-button" />,
}));

jest.mock("@/components/drop-forge/DropForgeTestnetIndicator", () => ({
  __esModule: true,
  default: () => <div data-testid="testnet-indicator" />,
}));

jest.mock("@/components/home/now-minting/NowMintingCountdown", () => ({
  __esModule: true,
  default: () => <div data-testid="countdown" />,
}));

jest.mock("@/components/manifold-minting/ManifoldMintingWidget", () => ({
  __esModule: true,
  default: (props: { setMintForAddress?: (address: string | null) => void }) => (
    <button
      data-testid="mint-widget"
      onClick={() => props.setMintForAddress?.("0xabc")}
    />
  ),
}));

jest.mock("@/components/nft-attributes/NFTAttributes", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-attributes" />,
}));

jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-image" />,
}));

jest.mock("@/components/nft-marketplace-links/NFTMarketplaceLinks", () => ({
  __esModule: true,
  default: () => <div data-testid="marketplace-links" />,
}));

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null }),
}));

jest.mock("@/helpers/Helpers", () => ({
  areEqualAddresses: jest.fn(() => true),
  capitalizeEveryWord: jest.fn((value: string) => value),
  fromGWEI: jest.fn(() => 0),
  getNameForContract: jest.fn(() => "Memes by 6529"),
  getPathForContract: jest.fn(() => "the-memes"),
  numberWithCommas: jest.fn((value: number) => value.toLocaleString()),
  parseNftDescriptionToHtml: jest.fn((value: string) => value),
}));

jest.mock("@/constants/constants", () => ({
  ETHEREUM_ICON_TEXT: "ETH",
  MANIFOLD_LAZY_CLAIM_CONTRACT: "0xproxy",
  MEMES_CONTRACT: "0xmemes",
}));

jest.mock("@/helpers/time", () => ({
  Time: {
    now: jest.fn(() => ({
      toMillis: () => Date.UTC(2026, 2, 18, 18, 25),
      toSeconds: () => Date.UTC(2026, 2, 18, 18, 25) / 1000,
      toDate: () => new Date(Date.UTC(2026, 2, 18, 18, 25)),
      toLocaleDateTimeString: () => "2026-03-18 18:25",
      toIsoDateString: () => "2026-03-18",
      toIsoTimeString: () => "18:25:00 UTC",
    })),
    seconds: jest.fn((seconds: number) => ({
      toMillis: () => seconds * 1000,
      toSeconds: () => seconds,
      toDate: () => new Date(seconds * 1000),
      toLocaleDateTimeString: () => `date-${seconds}`,
      toIsoDateString: () => "2026-03-18",
      toIsoTimeString: () => "00:00:00 UTC",
    })),
  },
}));

jest.mock("@/hooks/useManifoldClaim", () => {
  const createPhaseTime = (ms: number) => ({
    toMillis: () => ms,
    toSeconds: () => ms / 1000,
    toDate: () => new Date(ms),
    toLocaleDateTimeString: () => `time-${ms}`,
    toIsoDateString: () => "2026-03-18",
    toIsoTimeString: () => "00:00:00 UTC",
    lt: (other: { toMillis: () => number }) => ms < other.toMillis(),
    gt: (other: { toMillis: () => number }) => ms > other.toMillis(),
    gte: (other: { toMillis: () => number }) => ms >= other.toMillis(),
    lte: (other: { toMillis: () => number }) => ms <= other.toMillis(),
  });

  return {
    __esModule: true,
    useManifoldClaim: mockUseManifoldClaim,
    buildMemesPhases: jest.fn(() => [
      {
        id: "0",
        name: "Phase 0 (Allowlist)",
        type: "Allowlist",
        start: createPhaseTime(Date.UTC(2026, 2, 18, 17, 40)),
        end: createPhaseTime(Date.UTC(2026, 2, 18, 18, 20)),
      },
      {
        id: "1",
        name: "Phase 1 (Allowlist)",
        type: "Allowlist",
        start: createPhaseTime(Date.UTC(2026, 2, 18, 18, 30)),
        end: createPhaseTime(Date.UTC(2026, 2, 18, 18, 50)),
      },
      {
        id: "2",
        name: "Phase 2 (Allowlist)",
        type: "Allowlist",
        start: createPhaseTime(Date.UTC(2026, 2, 18, 19, 0)),
        end: createPhaseTime(Date.UTC(2026, 2, 18, 19, 20)),
      },
      {
        id: "public",
        name: "Public Phase",
        type: "Public Phase",
        start: createPhaseTime(Date.UTC(2026, 2, 18, 19, 20)),
        end: createPhaseTime(Date.UTC(2026, 2, 19, 17, 0)),
      },
    ]),
    ManifoldClaimStatus: {
      ACTIVE: "active",
      UPCOMING: "upcoming",
      ENDED: "ended",
    },
    ManifoldPhase: {
      ALLOWLIST: "Allowlist",
      PUBLIC: "Public Phase",
    },
  };
});

describe("ManifoldMinting phases", () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
    mockUseManifoldClaim.mockReset();
    mockUseManifoldClaim.mockReturnValue({
      claim: {
        instanceId: 1,
        total: 153,
        totalMax: 328,
        remaining: 175,
        costWei: 0n,
        startDate: Date.UTC(2026, 2, 18, 17, 40) / 1000,
        endDate: Date.UTC(2026, 2, 18, 18, 20) / 1000,
        status: "ended",
        phase: "Allowlist",
        memePhase: { id: "0", name: "Phase 0 (Allowlist)" },
        nextMemePhase: { id: "1", name: "Phase 1 (Allowlist)" },
        isFetching: false,
        isFinalized: true,
        isDropComplete: false,
        isSoldOut: false,
        isError: false,
      },
      isFetching: false,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("shows only elapsed phases as completed during the downtime between memes phases", () => {
    const { container } = render(
      <ManifoldMinting
        title="Test Meme"
        contract="0xmemes"
        chain={{ id: 1 } as any}
        abi={[]}
        mint_date={{ toMillis: () => Date.UTC(2026, 2, 18, 17, 40) } as any}
        mintMetadata={{
          tokenId: 123,
          metadata: {
            name: "Test NFT",
            description: "Test description",
            attributes: [],
            image_url: "test.jpg",
          },
        }}
      />
    );

    expect(screen.getByText("Phase 0 (Allowlist)")).toBeInTheDocument();
    expect(screen.getByText("Phase 1 (Allowlist)")).toBeInTheDocument();
    expect(screen.getByText("Phase 2 (Allowlist)")).toBeInTheDocument();
    expect(screen.getByText("Public Phase")).toBeInTheDocument();
    expect(screen.getAllByText("COMPLETED")).toHaveLength(1);
    expect(screen.getAllByText("UPCOMING")).toHaveLength(3);
    expect(screen.getByText("Unlimited spots")).toHaveClass(
      "tw-text-primary-300"
    );
    expect(
      container.querySelectorAll(".tw-ring-success, .tw-ring-primary-300")
    ).toHaveLength(1);
  });

  test("highlights only the active phase when a current phase exists", () => {
    mockUseManifoldClaim.mockReturnValue({
      claim: {
        instanceId: 1,
        total: 153,
        totalMax: 328,
        remaining: 175,
        costWei: 0n,
        startDate: Date.UTC(2026, 2, 18, 19, 0) / 1000,
        endDate: Date.UTC(2026, 2, 18, 19, 20) / 1000,
        status: "active",
        phase: "Allowlist",
        memePhase: { id: "2", name: "Phase 2 (Allowlist)" },
        nextMemePhase: { id: "public", name: "Public Phase" },
        isFetching: false,
        isFinalized: false,
        isDropComplete: false,
        isSoldOut: false,
        isError: false,
      },
      isFetching: false,
    });

    const { container } = render(
      <ManifoldMinting
        title="Test Meme"
        contract="0xmemes"
        chain={{ id: 1 } as any}
        abi={[]}
        mint_date={{ toMillis: () => Date.UTC(2026, 2, 18, 17, 40) } as any}
        mintMetadata={{
          tokenId: 123,
          metadata: {
            name: "Test NFT",
            description: "Test description",
            attributes: [],
            image_url: "test.jpg",
          },
        }}
      />
    );

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getAllByText("UPCOMING")).toHaveLength(1);
    expect(screen.getByText("Unlimited spots")).toHaveClass(
      "tw-text-primary-300"
    );
    expect(container.querySelectorAll(".tw-ring-success")).toHaveLength(1);
    expect(container.querySelectorAll(".tw-ring-primary-300")).toHaveLength(0);
  });

  test("shows no eligible spots after distribution data resolves without an allowlist entry", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            airdrops: 0,
            allowlist: [],
          },
        ],
      }),
    });

    render(
      <ManifoldMinting
        title="Test Meme"
        contract="0xmemes"
        chain={{ id: 1 } as any}
        abi={[]}
        mint_date={{ toMillis: () => Date.UTC(2026, 2, 18, 17, 40) } as any}
        mintMetadata={{
          tokenId: 123,
          metadata: {
            name: "Test NFT",
            description: "Test description",
            attributes: [],
            image_url: "test.jpg",
          },
        }}
      />
    );

    await userEvent.click(screen.getByTestId("mint-widget"));

    await waitFor(() =>
      expect(screen.getAllByText("No eligible spots")).toHaveLength(3)
    );
    expect(screen.queryByText("Loading eligibility...")).not.toBeInTheDocument();
  });
});
