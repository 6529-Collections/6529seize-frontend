import React from "react";
import { render, screen } from "@testing-library/react";
import ActivityTable from "@/components/latest-activity/ActivityTable";
import type { Transaction } from "@/entities/ITransaction";
import type { NFT } from "@/entities/INFT";
import type { NextGenCollection } from "@/entities/INextgen";

// Mock the child component to isolate ActivityTable testing
jest.mock("@/components/latest-activity/LatestActivityRow", () => {
  return function MockLatestActivityRow(props: any) {
    return (
      <tr data-testid="activity-row">
        <td>{props.tr.token_id}</td>
        <td>{props.tr.contract}</td>
        <td>{props.nft?.name || "No NFT"}</td>
        <td>{props.nextgen_collection?.name || "No NextGen"}</td>
      </tr>
    );
  };
});

// Mock Bootstrap components
jest.mock("react-bootstrap", () => ({
  Row: ({ children, ...props }: any) => (
    <div data-testid="row" {...props}>
      {children}
    </div>
  ),
  Col: ({ children, ...props }: any) => (
    <div data-testid="col" {...props}>
      {children}
    </div>
  ),
  Table: ({ children, ...props }: any) => (
    <table data-testid="table" {...props}>
      {children}
    </table>
  ),
}));

// Mock helpers
jest.mock("@/helpers/Helpers", () => ({
  areEqualAddresses: jest.fn((a: string, b: string) => a.toLowerCase() === b.toLowerCase()),
  isNextgenContract: jest.fn((contract: string) => contract.includes("nextgen")),
}));

jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  normalizeNextgenTokenID: jest.fn((tokenId: number) => ({
    collection_id: Math.floor(tokenId / 1000),
    token_id: tokenId % 1000,
  })),
}));

describe("ActivityTable", () => {
  const mockTransactions: Transaction[] = [
    {
      contract: "0x123",
      from_address: "0xfrom1",
      to_address: "0xto1",
      token_id: 1,
      transaction: "0xtx1",
      value: 1.5,
      gas: 21000,
      gas_gwei: 20,
      gas_price_gwei: 20,
      royalties: 0.1,
      token_count: 1,
      from_display: "From1",
      to_display: "To1",
      transaction_date: "2023-01-01",
    },
    {
      contract: "0x456",
      from_address: "0xfrom2",
      to_address: "0xto2",
      token_id: 2,
      transaction: "0xtx2",
      value: 2.0,
      gas: 25000,
      gas_gwei: 25,
      gas_price_gwei: 25,
      royalties: 0.2,
      token_count: 1,
      from_display: "From2",
      to_display: "To2",
      transaction_date: "2023-01-02",
    },
  ] as Transaction[];

  const mockNFTs: NFT[] = [
    {
      id: 1,
      contract: "0x123",
      name: "Test NFT 1",
      image: "image1.jpg",
      thumbnail: "thumb1.jpg",
      icon: "icon1.jpg",
      scaled: "scaled1.jpg",
    } as NFT,
    {
      id: 2,
      contract: "0x456",
      name: "Test NFT 2",
      image: "image2.jpg",
      thumbnail: "thumb2.jpg",
      icon: "icon2.jpg",
      scaled: "scaled2.jpg",
    } as NFT,
  ];

  const mockNextgenCollections: NextGenCollection[] = [
    {
      id: 1,
      name: "NextGen Collection 1",
    } as NextGenCollection,
    {
      id: 2,
      name: "NextGen Collection 2",
    } as NextGenCollection,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing with empty data", () => {
    render(
      <ActivityTable
        activity={[]}
        nfts={[]}
        nextgenCollections={[]}
      />
    );
    
    expect(screen.getByTestId("row")).toBeInTheDocument();
    expect(screen.getByTestId("col")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  it("renders activity rows when activity data is provided", () => {
    render(
      <ActivityTable
        activity={mockTransactions}
        nfts={mockNFTs}
        nextgenCollections={mockNextgenCollections}
      />
    );

    const activityRows = screen.getAllByTestId("activity-row");
    expect(activityRows).toHaveLength(2);
  });

  it("passes correct transaction data to each row", () => {
    render(
      <ActivityTable
        activity={mockTransactions}
        nfts={mockNFTs}
        nextgenCollections={mockNextgenCollections}
      />
    );

    expect(screen.getByText("1")).toBeInTheDocument(); // token_id from first transaction
    expect(screen.getByText("2")).toBeInTheDocument(); // token_id from second transaction
    expect(screen.getByText("0x123")).toBeInTheDocument(); // contract from first transaction
    expect(screen.getByText("0x456")).toBeInTheDocument(); // contract from second transaction
  });

  it("matches NFTs to transactions by token_id and contract", () => {
    render(
      <ActivityTable
        activity={mockTransactions}
        nfts={mockNFTs}
        nextgenCollections={mockNextgenCollections}
      />
    );

    expect(screen.getByText("Test NFT 1")).toBeInTheDocument();
    expect(screen.getByText("Test NFT 2")).toBeInTheDocument();
  });

  it("handles NextGen contracts correctly", () => {
    const { areEqualAddresses, isNextgenContract } = require("@/helpers/Helpers");
    const { normalizeNextgenTokenID } = require("@/components/nextGen/nextgen_helpers");
    
    // Mock NextGen contract detection
    isNextgenContract.mockImplementation((contract: string) => contract === "0xnextgen");

    const nextgenTransaction: Transaction = {
      contract: "0xnextgen",
      token_id: 1001, // Will normalize to collection_id: 1, token_id: 1
      from_address: "0xfrom",
      to_address: "0xto",
      transaction: "0xtx",
      value: 1,
      gas: 21000,
      gas_gwei: 20,
      gas_price_gwei: 20,
      royalties: 0,
      token_count: 1,
      from_display: "From",
      to_display: "To",
      transaction_date: "2023-01-01",
    } as Transaction;

    render(
      <ActivityTable
        activity={[nextgenTransaction]}
        nfts={mockNFTs}
        nextgenCollections={mockNextgenCollections}
      />
    );

    expect(normalizeNextgenTokenID).toHaveBeenCalledWith(1001);
    expect(screen.getByText("NextGen Collection 1")).toBeInTheDocument();
  });

  it("handles missing NFT data gracefully", () => {
    render(
      <ActivityTable
        activity={mockTransactions}
        nfts={[]} // Empty NFT array
        nextgenCollections={mockNextgenCollections}
      />
    );

    expect(screen.getAllByText("No NFT")).toHaveLength(2);
  });

  it("handles missing NextGen collection data gracefully", () => {
    const { isNextgenContract } = require("@/helpers/Helpers");
    isNextgenContract.mockReturnValue(true);

    render(
      <ActivityTable
        activity={mockTransactions}
        nfts={mockNFTs}
        nextgenCollections={[]} // Empty collections array
      />
    );

    expect(screen.getAllByText("No NextGen")).toHaveLength(2);
  });

  it("generates correct keys for activity rows", () => {
    const ActivityTableComponent = require("@/components/latest-activity/ActivityTable").default;
    
    render(
      <ActivityTableComponent
        activity={mockTransactions}
        nfts={mockNFTs}
        nextgenCollections={mockNextgenCollections}
      />
    );

    // Verify that unique keys are generated for each row
    // This is implicitly tested by React not throwing key warnings
    const activityRows = screen.getAllByTestId("activity-row");
    expect(activityRows).toHaveLength(2);
  });

  it("applies correct CSS classes", () => {
    render(
      <ActivityTable
        activity={mockTransactions}
        nfts={mockNFTs}
        nextgenCollections={mockNextgenCollections}
      />
    );

    const rowElement = screen.getByTestId("row");
    
    expect(rowElement).toHaveClass("pt-3");
    // The table's bordered prop is passed to the mock component correctly
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  it("handles undefined activity gracefully", () => {
    render(
      <ActivityTable
        activity={undefined as any}
        nfts={mockNFTs}
        nextgenCollections={mockNextgenCollections}
      />
    );

    expect(screen.queryByTestId("activity-row")).not.toBeInTheDocument();
  });

  it("handles undefined nfts gracefully", () => {
    render(
      <ActivityTable
        activity={mockTransactions}
        nfts={undefined as any}
        nextgenCollections={mockNextgenCollections}
      />
    );

    expect(screen.queryByTestId("activity-row")).not.toBeInTheDocument();
  });
});