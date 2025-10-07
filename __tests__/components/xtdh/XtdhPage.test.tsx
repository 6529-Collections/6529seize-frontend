import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
jest.mock("@/components/auth/Auth", () => {
  const React = require("react");
  const defaultValue = {
    connectedProfile: null,
    activeProfileProxy: null,
    setToast: jest.fn(),
    requestAuth: jest.fn(async () => ({ success: true })),
  };
  const AuthContext = React.createContext(defaultValue);
  return { AuthContext };
});

import XtdhPage from "@/components/xtdh/XtdhPage";
import { AuthContext } from "@/components/auth/Auth";
import {
  useXtdhOverviewStats,
  useXtdhCollections,
  useXtdhTokens,
} from "@/hooks/useXtdhOverview";

const mockUseSearchParams = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/xtdh",
}));

jest.mock("@/hooks/useXtdhOverview", () => ({
  useXtdhOverviewStats: jest.fn(),
  useXtdhCollections: jest.fn(),
  useXtdhTokens: jest.fn(),
}));

const mockedOverviewStats = useXtdhOverviewStats as jest.Mock;
const mockedCollections = useXtdhCollections as jest.Mock;
const mockedTokens = useXtdhTokens as jest.Mock;

const baseDate = new Date().toISOString();

const collectionFixture = {
  collectionId: "memes",
  collectionName: "The Memes",
  collectionImage: "https://example.com/memes.png",
  collectionSlug: "the-memes",
  description: "A test collection",
  blockchain: "ethereum",
  contractAddress: "0x1234",
  tokenStandard: "ERC721" as const,
  tokenCount: 100,
  receivingTokenCount: 3,
  totalXtdhRate: 900,
  totalXtdhAllocated: 850,
  grantorCount: 2,
  grantCount: 5,
  topGrantors: [
    {
      profileId: "gm6529",
      displayName: "GM 6529",
      profileImage: "",
      xtdhRateGranted: 400,
    },
    {
      profileId: "test-user",
      displayName: "Test User",
      profileImage: "",
      xtdhRateGranted: 250,
    },
  ],
  granters: [
    {
      profileId: "gm6529",
      displayName: "GM 6529",
      profileImage: "",
      xtdhRateGranted: 400,
    },
    {
      profileId: "test-user",
      displayName: "Test User",
      profileImage: "",
      xtdhRateGranted: 250,
    },
  ],
  holderSummaries: [
    {
      profileId: "test-user",
      displayName: "Test User",
      profileImage: "",
      tokenCount: 2,
      xtdhEarned: 180,
      lastEarnedAt: baseDate,
    },
  ],
  tokens: [],
  lastAllocatedAt: baseDate,
  lastUpdatedAt: baseDate,
};

const tokenFixture = {
  collectionId: "memes",
  collectionName: "The Memes",
  collectionImage: "https://example.com/memes.png",
  collectionSlug: "the-memes",
  blockchain: "ethereum",
  contractAddress: "0x1234",
  tokenStandard: "ERC721" as const,
  tokenId: "1",
  tokenName: "GM District",
  tokenImage: "https://example.com/token.png",
  xtdhRate: 120,
  totalXtdhAllocated: 120,
  grantorCount: 2,
  topGrantors: [
    {
      profileId: "gm6529",
      displayName: "GM 6529",
      profileImage: "",
      xtdhRateGranted: 70,
    },
    {
      profileId: "test-user",
      displayName: "Test User",
      profileImage: "",
      xtdhRateGranted: 50,
    },
  ],
  granters: [
    {
      profileId: "gm6529",
      displayName: "GM 6529",
      profileImage: "",
      xtdhRateGranted: 70,
    },
    {
      profileId: "test-user",
      displayName: "Test User",
      profileImage: "",
      xtdhRateGranted: 50,
    },
  ],
  holderSummaries: [
    {
      profileId: "test-user",
      displayName: "Test User",
      profileImage: "",
      tokenCount: 1,
      xtdhEarned: 60,
      lastEarnedAt: baseDate,
    },
  ],
  lastAllocatedAt: baseDate,
} as const;

function renderWithAuth(connectedProfile: any = null) {
  return render(
    <AuthContext.Provider
      value={{
        connectedProfile,
        activeProfileProxy: null,
        setToast: jest.fn(),
        requestAuth: jest.fn(async () => ({ success: true })),
      }}
    >
      <XtdhPage />
    </AuthContext.Provider>
  );
}

describe("XtdhPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    mockedOverviewStats.mockReturnValue({
      data: {
        totalCollections: 3,
        totalGrantors: 5,
        totalTokens: 6,
        totalXtdhAllocated: 1400,
        totalXtdhRate: 1600,
        lastUpdatedAt: baseDate,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockedCollections.mockReturnValue({
      data: {
        collections: [collectionFixture],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        availableFilters: {
          networks: ["ethereum"],
          grantors: [],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });

    mockedTokens.mockReturnValue({
      data: {
        tokens: [tokenFixture],
        totalCount: 1,
        page: 1,
        pageSize: 25,
        availableFilters: {
          networks: ["ethereum"],
          grantors: [],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    });
  });

  it("renders collections by default", () => {
    renderWithAuth();
    expect(
      screen.getByRole("heading", { name: "Collections Receiving xTDH" })
    ).toBeInTheDocument();
    expect(screen.getByText("The Memes")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("navigates to tokens view when toggled", async () => {
    renderWithAuth();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Tokens" }));

    expect(mockReplace).toHaveBeenCalledWith("/xtdh?view=tokens&page=1", {
      scroll: false,
    });
  });

  it("highlights allocations for connected user", () => {
    const connectedProfile = {
      query: "test-user",
      handle: "test-user",
      primary_wallet: "0xabc",
      consolidation_key: "test-user",
    };

    renderWithAuth(connectedProfile);

    expect(
      screen.getByText(/You allocated 250 xTDH here/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/You hold 2 tokens · earning 180 xTDH/i)
    ).toBeInTheDocument();
  });

  it("renders tokens view when query param is provided", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("view=tokens"));
    renderWithAuth();

    expect(
      screen.getByRole("heading", { name: "Tokens Receiving xTDH" })
    ).toBeInTheDocument();
    expect(screen.getByText("GM District")).toBeInTheDocument();
  });
});
