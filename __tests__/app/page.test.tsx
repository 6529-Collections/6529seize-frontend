import React, { useMemo } from "react";
import { render, screen } from "@testing-library/react";
import Home from "@/components/home/Home";
import { AuthContext } from "@/components/auth/Auth";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentContext";

jest.mock("next/dynamic", () => () => () => <div data-testid="dynamic" />);
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow",
  () => () => <div data-testid="slideshow" />
);
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ platform: "web" })),
}));

jest.mock("@/contexts/TitleContext", () => ({
  useTitle: () => ({
    title: "Test Title",
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockNft = {
  id: 1,
  name: "Mock NFT",
  contract: "0x1",
  collection: "COL",
  season: 1,
  meme_name: "Meme",
  artist: "Artist",
  mint_date: "2020-01-01",
  metadata: { image_details: { format: "png", width: 1, height: 1 } },
} as any;

const mockCollection = { name: "Collection" } as any;

const TestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setTitle = jest.fn();
  const authContextValue = useMemo(
    () => ({
      setTitle,
      connectedProfile: null,
    }),
    [setTitle]
  );
  return (
    <CookieConsentProvider>
      <AuthContext.Provider value={authContextValue as any}>
        {children}
      </AuthContext.Provider>
    </CookieConsentProvider>
  );
};

describe("Home component", () => {
  it("renders main sections", () => {
    render(
      <TestProvider>
        <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
      </TestProvider>
    );

    expect(screen.getByText(/Latest/i)).toBeInTheDocument();
    expect(screen.getByText(/Drop/i)).toBeInTheDocument();
    expect(
      screen.getByText(`Card ${mockNft.id} - ${mockNft.name}`)
    ).toBeInTheDocument();
    expect(screen.getByText(/Discover/i)).toBeInTheDocument();
  });
});
