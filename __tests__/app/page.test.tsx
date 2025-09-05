import React, { useMemo } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import Home from "@/components/home/Home";
import { AuthContext } from "@/components/auth/Auth";

// Mock essential external dependencies
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => (
    <img alt={props.alt ?? ""} src={props.src} width={props.width} height={props.height} />
  ),
}));

// Mock NextGen slideshow component
jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow",
  () => () => <div data-testid="nextgen-slideshow" />
);

// Mock LatestActivity as a simple component to prevent API calls
jest.mock("@/components/latest-activity/LatestActivity", () => 
  () => <div data-testid="latest-activity">Latest Activity</div>
);


// Mock API fetch to prevent network calls
jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn().mockResolvedValue({ data: [] }),
  fetchAllPages: jest.fn().mockResolvedValue([]),
}));



// Mock home page components with simplified structure
jest.mock("@/components/home/LatestDropSection", () => 
  ({ featuredNft }: any) => (
    <div data-testid="latest-drop-section">
      <h1><span>Latest</span> Drop</h1>
      <div data-testid="nft-details">
        <span>Card {featuredNft.id} - {featuredNft.name}</span>
        <span>{featuredNft.collection}</span>
        <span>Season {featuredNft.season}</span>
        <span>{featuredNft.meme_name}</span>
      </div>
    </div>
  )
);


const mockNft = {
  id: 123,
  name: "Test Meme NFT",
  contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
  collection: "The Memes by 6529",
  season: 6,
  meme_name: "Test Meme",
  artist: "Test Artist",
  mint_date: "2024-01-15",
  metadata: { 
    image_details: { 
      format: "png", 
      width: 2000, 
      height: 2000 
    } 
  },
} as any;

const mockCollection = { 
  name: "Test NextGen Collection",
  id: "test-collection" 
} as any;


const TestProvider: React.FC<{ 
  children: React.ReactNode;
  connectedProfile?: any;
}> = ({ children, connectedProfile = null }) => {
  const authContextValue = useMemo(
    () => ({
      connectedProfile,
      setTitle: jest.fn(),
    }),
    [connectedProfile]
  );
  return (
    <AuthContext.Provider value={authContextValue as any}>
      {children}
    </AuthContext.Provider>
  );
};

describe("Home component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays featured NFT information correctly", async () => {
    render(
      <TestProvider>
        <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
      </TestProvider>
    );

    // Verify main sections are present
    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByText("Drop")).toBeInTheDocument();
    
    // Verify NFT details are displayed in a user-friendly way
    const nftDetails = screen.getByTestId("nft-details");
    expect(nftDetails).toHaveTextContent(`Card ${mockNft.id} - ${mockNft.name}`);
    expect(nftDetails).toHaveTextContent(mockNft.collection);
    expect(nftDetails).toHaveTextContent(`Season ${mockNft.season}`);
    expect(nftDetails).toHaveTextContent(mockNft.meme_name);
  });

  it("shows NextGen collection when provided", () => {
    render(
      <TestProvider>
        <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
      </TestProvider>
    );

    // Check for NextGen discover section
    expect(screen.getByText("Discover")).toBeInTheDocument();
    expect(screen.getByText(`NextGen - ${mockCollection.name}`)).toBeInTheDocument();
    expect(screen.getByText("View Collection")).toBeInTheDocument();
    expect(screen.getByTestId("nextgen-slideshow")).toBeInTheDocument();
  });

  it("hides NextGen section when no collection provided", () => {
    render(
      <TestProvider>
        <Home featuredNft={mockNft} featuredNextgen={null} />
      </TestProvider>
    );

    // NextGen section should not be visible
    expect(screen.queryByText("Discover")).not.toBeInTheDocument();
    expect(screen.queryByText(/NextGen/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("nextgen-slideshow")).not.toBeInTheDocument();
  });

  it("includes latest activity section", () => {
    render(
      <TestProvider>
        <Home featuredNft={mockNft} featuredNextgen={mockCollection} />
      </TestProvider>
    );

    expect(screen.getByTestId("latest-activity")).toBeInTheDocument();
  });


  it("handles incomplete NFT data gracefully", () => {
    const incompleteNft = {
      ...mockNft,
      name: "",
      meme_name: "",
    };

    render(
      <TestProvider>
        <Home featuredNft={incompleteNft} featuredNextgen={mockCollection} />
      </TestProvider>
    );

    // Component should still render the main structure
    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByText("Drop")).toBeInTheDocument();
    expect(screen.getByTestId("nft-details")).toBeInTheDocument();
  });

});

describe("Home component error scenarios", () => {
  it("should fail fast with invalid featuredNft", () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(
        <TestProvider>
          <Home featuredNft={null as any} featuredNextgen={mockCollection} />
        </TestProvider>
      );
    }).toThrow();
    
    consoleSpy.mockRestore();
  });

  it("works correctly without NextGen collection", () => {
    render(
      <TestProvider>
        <Home featuredNft={mockNft} featuredNextgen={undefined as any} />
      </TestProvider>
    );

    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.queryByText(/NextGen/)).not.toBeInTheDocument();
  });
});

