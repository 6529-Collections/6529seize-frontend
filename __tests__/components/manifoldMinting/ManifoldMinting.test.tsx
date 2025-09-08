import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ManifoldMinting from "../../../components/manifoldMinting/ManifoldMinting";
import { Time } from "../../../helpers/time";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

jest.mock("react-bootstrap", () => {
  return {
    Container: (p: any) => <div>{p.children}</div>,
    Row: (p: any) => <div>{p.children}</div>,
    Col: (p: any) => <div>{p.children}</div>,
    Table: (p: any) => <table>{p.children}</table>,
  };
});

jest.mock("../../../components/nft-image/NFTImage", () => () => (
  <div data-testid="image" />
));
jest.mock("../../../components/nftAttributes/NFTAttributes", () => () => (
  <div data-testid="attrs" />
));
jest.mock("../../../components/manifoldMinting/ManifoldMintingWidget", () => () => (
  <div data-testid="widget" />
));
jest.mock("../../../components/the-memes/MemePageMintCountdown", () => () => (
  <div data-testid="countdown" />
));

// Mock the Time class used in the component
jest.mock("../../../helpers/time", () => ({
  Time: {
    now: jest.fn(() => ({
      toMillis: jest.fn(() => Date.now()),
      toSeconds: jest.fn(() => Date.now() / 1000),
      toDate: jest.fn(() => new Date()),
      toLocaleDateTimeString: jest.fn(() => "2023-01-01 12:00"),
      toIsoDateString: jest.fn(() => "2023-01-01"), 
      toIsoTimeString: jest.fn(() => "12:00:00 UTC"),
      lt: jest.fn(() => false),
      gt: jest.fn(() => true)
    })),
    seconds: jest.fn((s) => ({
      toMillis: jest.fn(() => s * 1000),
      toSeconds: jest.fn(() => s),
      toDate: jest.fn(() => new Date(s * 1000)),
      toLocaleDateTimeString: jest.fn(() => "2023-01-01 12:00"),
      toIsoDateString: jest.fn(() => "2023-01-01"),
      toIsoTimeString: jest.fn(() => "12:00:00 UTC"),
      lt: jest.fn(() => false),
      gt: jest.fn(() => true)
    }))
  }
}));

// Mock all the helper functions to avoid implementation complexity
jest.mock("../../../helpers/Helpers", () => ({
  areEqualAddresses: jest.fn(() => true),
  capitalizeEveryWord: jest.fn((s: string) => s),
  fromGWEI: jest.fn((n: number) => n / 1000000000),
  getNameForContract: jest.fn(() => "Memes by 6529"),
  getPathForContract: jest.fn(() => "memes"),
  numberWithCommas: jest.fn((n: number) => n.toLocaleString()),
  parseNftDescriptionToHtml: jest.fn((d: string) => d),
}));

jest.mock("../../../hooks/useManifoldClaim", () => {
  // Create mock Time objects that include all necessary methods
  const createMockTime = (ms = Date.now()) => ({
    lt: jest.fn(() => false),
    gt: jest.fn(() => true),
    gte: jest.fn(() => true),
    lte: jest.fn(() => false),
    eq: jest.fn(() => false),
    minus: jest.fn(() => createMockTime()),
    plus: jest.fn(() => createMockTime()),
    toMillis: jest.fn(() => ms),
    toDate: jest.fn(() => new Date(ms)),
    toSeconds: jest.fn(() => ms / 1000),
    toLocaleDateTimeString: jest.fn(() => "2023-01-01 12:00"),
    toIsoDateString: jest.fn(() => "2023-01-01"),
    toIsoTimeString: jest.fn(() => "12:00:00 UTC")
  });

  return {
    __esModule: true,
    useManifoldClaim: jest.fn(),
    ManifoldClaimStatus: { 
      ACTIVE: "active",
      UPCOMING: "upcoming", 
      ENDED: "ended" 
    },
    ManifoldPhase: {
      ALLOWLIST: "Allowlist",
      PUBLIC: "Public Phase"
    },
    buildMemesPhases: jest.fn(() => [
      {
        id: "0",
        name: "Phase 0 (Allowlist)",
        type: "Allowlist",
        start: createMockTime(Date.now() - 3600000), // 1 hour ago
        end: createMockTime(Date.now() + 3600000), // 1 hour from now
      },
      {
        id: "public", 
        name: "Public Phase",
        type: "Public Phase",
        start: createMockTime(Date.now() + 3600000), // 1 hour from now
        end: createMockTime(Date.now() + 86400000), // 1 day from now
      },
    ]),
  };
});

// Mock the constants
jest.mock("../../../constants", () => ({
  ETHEREUM_ICON_TEXT: "Ξ",
  MEMES_CONTRACT: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
}));

const { useManifoldClaim } = require("../../../hooks/useManifoldClaim") as {
  useManifoldClaim: jest.Mock;
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

const createMockManifoldInstance = (overrides = {}) => ({
  id: 1,
  publicData: {
    asset: { 
      name: "Test NFT", 
      description: "Test description", 
      attributes: [],
      image_url: "test.jpg",
      animation_url: "",
      animation_details: null,
    },
    instanceAllowlist: { merkleTreeId: 1 },
  },
  ...overrides,
});

const createMockClaim = (overrides = {}) => ({
  instanceId: 1,
  total: 100,
  totalMax: 1000,
  remaining: 900,
  cost: 50000000000000000, // 0.05 ETH in wei
  startDate: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  endDate: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  status: "active",
  phase: "Public Phase",
  isFetching: false,
  isFinalized: false,
  ...overrides,
});

const defaultProps = {
  title: "Test Meme",
  contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
  proxy: "0x2",
  abi: {},
  token_id: 123,
  mint_date: {
    toMillis: jest.fn(() => Date.now()),
    toSeconds: jest.fn(() => Date.now() / 1000),
    toDate: jest.fn(() => new Date()),
    toLocaleDateTimeString: jest.fn(() => "2023-01-01 12:00"),
    toIsoDateString: jest.fn(() => "2023-01-01"),
    toIsoTimeString: jest.fn(() => "12:00:00 UTC")
  } as any, // Mock Time object
};

afterEach(() => {
  jest.clearAllMocks();
});

describe("Basic Functionality", () => {
  test("shows error message when hook reports error", async () => {
    let called = false;
    useManifoldClaim.mockImplementation((c, p, a, t, onError) => {
      if (!called) {
        called = true;
        onError();
      }
      return undefined;
    });
    
    render(<ManifoldMinting {...defaultProps} />);
    await screen.findByText("Error fetching mint information");
  });

  test("shows loading state initially", () => {
    useManifoldClaim.mockReturnValue(undefined);
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<ManifoldMinting {...defaultProps} />);
    expect(screen.getByText("Retrieving Mint information")).toBeInTheDocument();
  });

  test("renders basic NFT information when data is available", async () => {
    useManifoldClaim.mockReturnValue(createMockClaim());
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockManifoldInstance()),
    });
    
    render(<ManifoldMinting {...defaultProps} />);
    
    // Should render title and basic info - component renders "Mint" span and title text
    expect(screen.getByText("Mint")).toBeInTheDocument();
    expect(screen.getByText("Test Meme")).toBeInTheDocument();
    
    // Wait for the NFT info to load and display
    await waitFor(() => {
      expect(screen.getByText("Test NFT")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

describe("Component Structure", () => {
  test("renders child components when data is available", async () => {
    useManifoldClaim.mockReturnValue(createMockClaim());
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockManifoldInstance()),
    });
    
    render(<ManifoldMinting {...defaultProps} />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Test NFT")).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Check that child components are rendered
    expect(screen.getByTestId("image")).toBeInTheDocument();
    expect(screen.getByTestId("attrs")).toBeInTheDocument();
    expect(screen.getByTestId("widget")).toBeInTheDocument();
  });

  test("displays edition size and pricing information", async () => {
    useManifoldClaim.mockReturnValue(createMockClaim({
      total: 100,
      totalMax: 1000,
      remaining: 900,
      cost: 50000000000000000 // 0.05 ETH in wei
    }));
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createMockManifoldInstance()),
    });
    
    render(<ManifoldMinting {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText("Test NFT")).toBeInTheDocument();
      // Check that the mock functions were called for rendering data
      const helpers = require("../../../helpers/Helpers");
      expect(helpers.numberWithCommas).toHaveBeenCalled();
      expect(helpers.fromGWEI).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
