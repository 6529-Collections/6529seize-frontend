import { render, screen } from "@testing-library/react";
import React from "react";
import NextGenTokenPageClient from "@/app/nextgen/token/[token]/[[...view]]/NextGenTokenPageClient";
import NextGenCollectionPageClient from "@/app/nextgen/collection/[collection]/[[...view]]/NextGenCollectionPageClient";
import { AuthContext } from "@/components/auth/Auth";

// Mock Next.js App Router navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/nextgen/token/123",
  notFound: jest.fn(),
}));

// Mock the main NextGen components
jest.mock("@/components/nextGen/collections/collectionParts/NextGenCollection", () => ({
  __esModule: true,
  default: () => <div data-testid="collection-component" />,
  ContentView: {
    OVERVIEW: "OVERVIEW",
    ABOUT: "ABOUT",
    ART: "ART",
  },
}));

jest.mock("@/components/nextGen/collections/nextgenToken/NextGenToken", () => ({
  __esModule: true,
  default: () => <div data-testid="token-component" />,
}));

jest.mock("@/components/nextGen/collections/NextGenTokenOnChain", () => ({
  __esModule: true,
  default: () => <div data-testid="token-onchain-component" />,
}));

// Mock useShallowRedirect hook used in collection pages
jest.mock("@/app/nextgen/collection/[collection]/useShallowRedirect", () => ({
  useShallowRedirect: jest.fn(),
}));

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionHeader",
  () => ({
    __esModule: true,
    default: ({ collection }: any) => (
      <div data-testid="collection-header">{collection?.name}</div>
    ),
    NextGenCollectionHead: ({ collection }: any) => (
      <div data-testid="collection-head">{collection?.name}</div>
    ),
  })
);

jest.mock(
  "@/components/nextGen/collections/NextGenNavigationHeader",
  () => ({
    __esModule: true,
    default: () => <div data-testid="navigation-header" />,
  })
);

// Mock TitleContext
const mockSetTitle = jest.fn();
jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockAuthContext = {
  setTitle: mockSetTitle,
  connectedProfile: null,
  activeProfileProxy: null,
  requestAuth: jest.fn(),
} as any;

function renderWithAuth(component: React.ReactElement) {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
}

const mockTokenPageClientProps = {
  tokenId: 123,
  token: {
    id: 123,
    name: "Test Token",
    collection_id: 1,
  },
  traits: [],
  tokenCount: 100,
  collection: {
    name: "Test Collection",
    id: 1,
  },
  view: "ABOUT",
};

const mockCollectionPageClientProps = {
  collection: {
    name: "Test Collection",
    id: 1,
  },
  view: "OVERVIEW",
};

describe("NextGen App Router Client Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders NextGen Token Page Client with token", () => {
    renderWithAuth(<NextGenTokenPageClient {...mockTokenPageClientProps} />);
    expect(screen.getByTestId("navigation-header")).toBeInTheDocument();
    expect(screen.getByTestId("token-component")).toBeInTheDocument();
    expect(mockSetTitle).toHaveBeenCalled();
  });

  it("renders NextGen Token Page Client without token (on-chain)", () => {
    const propsWithoutToken = {
      ...mockTokenPageClientProps,
      token: null,
    };
    renderWithAuth(<NextGenTokenPageClient {...propsWithoutToken} />);
    expect(screen.getByTestId("navigation-header")).toBeInTheDocument();
    expect(screen.getByTestId("token-onchain-component")).toBeInTheDocument();
  });

  it("renders NextGen Collection Page Client", () => {
    renderWithAuth(<NextGenCollectionPageClient {...mockCollectionPageClientProps} />);
    expect(screen.getByTestId("collection-component")).toBeInTheDocument();
    expect(mockSetTitle).toHaveBeenCalled();
  });

  it("calls setTitle on token page client mount with token name", () => {
    renderWithAuth(<NextGenTokenPageClient {...mockTokenPageClientProps} />);
    expect(mockSetTitle).toHaveBeenCalledWith(expect.stringContaining("Test Token"));
  });

  it("calls setTitle on token page client mount without token", () => {
    const propsWithoutToken = {
      ...mockTokenPageClientProps,
      token: null,
    };
    renderWithAuth(<NextGenTokenPageClient {...propsWithoutToken} />);
    expect(mockSetTitle).toHaveBeenCalledWith(expect.stringContaining("Test Collection - #123"));
  });

  it("calls setTitle on collection page client mount", () => {
    renderWithAuth(<NextGenCollectionPageClient {...mockCollectionPageClientProps} />);
    expect(mockSetTitle).toHaveBeenCalledWith(expect.stringContaining("Test Collection"));
  });
});
