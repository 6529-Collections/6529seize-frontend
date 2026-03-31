import NowMintingDetails from "@/components/home/now-minting/NowMintingDetails";
import { render, screen } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/components/home/now-minting/NowMintingHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));

jest.mock("@/components/home/now-minting/NowMintingStatsGrid", () => ({
  __esModule: true,
  default: () => <div data-testid="stats-grid" />,
}));

jest.mock("@/components/home/now-minting/NowMintingCountdown", () => ({
  __esModule: true,
  default: () => <div data-testid="countdown" />,
}));

const baseNft = {
  id: 667,
  name: "All the roads lead to OM",
  artist: "Lapis Light",
  artist_seize_handle: "lapislight",
  mint_date: new Date("2026-03-01"),
  floor_price: 1.23456,
  collection: "The Memes",
  season: 1,
};

describe("NowMintingDetails", () => {
  it("omits file metadata rows when media metadata is missing", () => {
    render(
      <NowMintingDetails
        nft={
          {
            ...baseNft,
            metadata: {},
          } as any
        }
      />
    );

    expect(screen.queryByText("File type")).not.toBeInTheDocument();
    expect(screen.queryByText("Dimensions")).not.toBeInTheDocument();
    expect(screen.getByText("Collection")).toBeInTheDocument();
    expect(screen.getByText("Season")).toBeInTheDocument();
  });

  it("renders file metadata rows when image metadata is present", () => {
    render(
      <NowMintingDetails
        nft={
          {
            ...baseNft,
            metadata: {
              image_details: {
                format: "PNG",
                width: 1200,
                height: 800,
              },
            },
          } as any
        }
      />
    );

    expect(screen.getByText("File type")).toBeInTheDocument();
    expect(screen.getByText("PNG")).toBeInTheDocument();
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
    expect(screen.getByText("1,200 x 800")).toBeInTheDocument();
  });
});
