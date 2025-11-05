import UserPageCollectedCard from "@/components/user/collected/cards/UserPageCollectedCard";
import { CollectedCard, CollectedCollectionType } from "@/entities/IProfile";
import { ContractType } from "@/enums";
import { render, screen } from "@testing-library/react";

const memeCard: CollectedCard = {
  collection: CollectedCollectionType.MEMES,
  token_id: 1,
  token_name: "Card",
  img: "/img.png",
  tdh: 2,
  rank: 3,
  seized_count: 1,
  szn: null,
};

describe("UserPageCollectedCard", () => {
  it("shows data row and seized count for memes", () => {
    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={1}
      />
    );
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("TDH")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Rank")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        const text = element?.textContent?.replaceAll(" ", "").trim() || "";
        return /^1\s*x$/.test(text);
      })
    ).toBeInTheDocument();
  });

  it("handles memelab collection", () => {
    const card: CollectedCard = {
      ...memeCard,
      collection: CollectedCollectionType.MEMELAB,
      seized_count: 0,
      szn: null,
    };
    render(
      <UserPageCollectedCard
        card={card}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={0}
      />
    );
    expect(screen.getAllByText("N/A").length).toBe(2);
  });
});
