import React from "react";
import { render, screen } from "@testing-library/react";
import NextGenCollectionSlideshow from "@/components/nextGen/collections/collectionParts/NextGenCollectionSlideshow";
import { NextGenCollection, NextGenToken } from "@/entities/INextgen";

// Mock the child components
jest.mock("@/components/nextGen/collections/collectionParts/hooks/SlideshowHeader", () => {
  return function MockSlideshowHeader({ collectionName }: { collectionName: string }) {
    return <div data-testid="slideshow-header">Header for {collectionName}</div>;
  };
});

jest.mock("@/components/nextGen/collections/collectionParts/hooks/TokenSlideshow", () => {
  return function MockTokenSlideshow({ collectionId, initialTokens }: { collectionId: number; initialTokens?: any[] }) {
    return (
      <div data-testid="token-slideshow">
        Collection ID: {collectionId}
        {initialTokens && <div data-testid="initial-tokens">Initial tokens: {initialTokens.length}</div>}
      </div>
    );
  };
});

const mockCollection: NextGenCollection = {
  id: 1,
  name: "Test Collection",
} as NextGenCollection;

const mockTokens: NextGenToken[] = [
  { id: 1, name: "Token1", token_id: 1 },
  { id: 2, name: "Token2", token_id: 2 },
  { id: 3, name: "Token3", token_id: 3 },
] as NextGenToken[];

describe("NextGenCollectionSlideshow", () => {
  it("renders slideshow container with Bootstrap classes", () => {
    const { container } = render(<NextGenCollectionSlideshow collection={mockCollection} />);
    
    // Should render the main container structure 
    const fluidContainer = container.querySelector(".container-fluid");
    expect(fluidContainer).toBeInTheDocument();
  });

  it("renders slideshow header with collection name", () => {
    render(<NextGenCollectionSlideshow collection={mockCollection} />);
    
    const header = screen.getByTestId("slideshow-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("Header for Test Collection");
  });

  it("renders token slideshow with collection ID", () => {
    render(<NextGenCollectionSlideshow collection={mockCollection} />);
    
    const slideshow = screen.getByTestId("token-slideshow");
    expect(slideshow).toBeInTheDocument();
    expect(slideshow).toHaveTextContent("Collection ID: 1");
  });

  it("passes initial tokens to slideshow when provided", () => {
    render(
      <NextGenCollectionSlideshow 
        collection={mockCollection} 
        initialTokens={mockTokens} 
      />
    );
    
    const slideshow = screen.getByTestId("token-slideshow");
    expect(slideshow).toBeInTheDocument();
    expect(screen.getByTestId("initial-tokens")).toHaveTextContent("Initial tokens: 3");
  });

  it("does not pass initial tokens when not provided", () => {
    render(<NextGenCollectionSlideshow collection={mockCollection} />);
    
    const slideshow = screen.getByTestId("token-slideshow");
    expect(slideshow).toBeInTheDocument();
    expect(screen.queryByTestId("initial-tokens")).not.toBeInTheDocument();
  });
});

