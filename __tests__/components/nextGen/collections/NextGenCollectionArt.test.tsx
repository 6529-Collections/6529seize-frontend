import { render, screen } from "@testing-library/react";
import NextGenCollectionArt from "@/components/nextGen/collections/collectionParts/NextGenCollectionArt";
import { NextGenCollection } from "@/entities/INextgen";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(() => Promise.resolve([])),
}));

jest.mock("@/components/nextGen/collections/NextGenTokenList", () => (props: any) => {
  props.setTotalResults(5);
  return <div data-testid="token-list" {...props}/>;
});

const routerPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: routerPush });

const collection: NextGenCollection = { id: 1, name: "My Collection" } as any;

describe("NextGenCollectionArt", () => {
  it("renders view all link when show_view_all", async () => {
    render(<NextGenCollectionArt collection={collection} show_view_all />);
    const link = screen.getByRole("link", { name: /View All/i });
    expect(link).toHaveAttribute(
      "href",
      "/nextgen/collection/my-collection/art"
    );
    expect(await screen.findByTestId("token-list")).toBeInTheDocument();
  });

  it("passes props to token list when not show_view_all", async () => {
    render(<NextGenCollectionArt collection={collection} />);
    const list = await screen.findByTestId("token-list");
    expect(list).toBeInTheDocument();
  });
});
