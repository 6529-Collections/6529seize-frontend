import UserPageCollectedCard from "@/components/user/collected/cards/UserPageCollectedCard";
import { CollectedCard, CollectedCollectionType } from "@/entities/IProfile";
import { ContractType } from "@/enums";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

  it("calls onToggle when selection button is clicked in select mode", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        onToggle={mockOnToggle}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={1}
      />
    );

    const selectButton = screen.getByLabelText("Select");
    await user.click(selectButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle when card is clicked in select mode", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        onToggle={mockOnToggle}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={1}
      />
    );

    const card = screen.getByRole("button", {
      name: "Select NFT for transfer",
    });
    await user.click(card);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle when Enter key is pressed on card in select mode", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        onToggle={mockOnToggle}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={1}
      />
    );

    const card = screen.getByRole("button", {
      name: "Select NFT for transfer",
    });
    card.focus();
    await user.keyboard("{Enter}");

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle when Space key is pressed on card in select mode", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        onToggle={mockOnToggle}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={1}
      />
    );

    const card = screen.getByRole("button", {
      name: "Select NFT for transfer",
    });
    card.focus();
    await user.keyboard(" ");

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onIncQty when increment button is clicked for ERC1155", async () => {
    const user = userEvent.setup();
    const mockOnIncQty = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        selected={true}
        onToggle={() => {}}
        onIncQty={mockOnIncQty}
        onDecQty={() => {}}
        copiesMax={5}
        qtySelected={1}
      />
    );

    const incButton = screen.getByLabelText("Increase quantity");
    await user.click(incButton);

    expect(mockOnIncQty).toHaveBeenCalledTimes(1);
  });

  it("calls onDecQty when decrement button is clicked for ERC1155", async () => {
    const user = userEvent.setup();
    const mockOnDecQty = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        selected={true}
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={mockOnDecQty}
        copiesMax={5}
        qtySelected={2}
      />
    );

    const decButton = screen.getByLabelText("Decrease quantity");
    await user.click(decButton);

    expect(mockOnDecQty).toHaveBeenCalledTimes(1);
  });

  it("disables increment button when qtySelected equals copiesMax", () => {
    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        selected={true}
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={3}
        qtySelected={3}
      />
    );

    const incButton = screen.getByLabelText("Increase quantity");
    expect(incButton).toBeDisabled();
  });

  it("calls onToggle when deselect button is clicked for ERC721", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC721}
        showDataRow={true}
        interactiveMode="select"
        selected={true}
        onToggle={mockOnToggle}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={1}
      />
    );

    const deselectButton = screen.getByLabelText("Deselect");
    await user.click(deselectButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("shows 'Not owned by your connected wallet' when copiesMax is 0", () => {
    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={0}
      />
    );

    expect(
      screen.getByText("Not owned by your connected wallet")
    ).toBeInTheDocument();
  });

  it("shows loading state when isTransferLoading is true", () => {
    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={0}
        isTransferLoading={true}
      />
    );

    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders as Link when interactiveMode is not select", () => {
    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="link"
        onToggle={() => {}}
        onIncQty={() => {}}
        onDecQty={() => {}}
        copiesMax={1}
      />
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/the-memes/1");
  });

  it("calls onToggle and onDecQty when decrementing from qtySelected 1 for ERC1155", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();
    const mockOnDecQty = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        selected={true}
        onToggle={mockOnToggle}
        onIncQty={() => {}}
        onDecQty={mockOnDecQty}
        copiesMax={5}
        qtySelected={1}
      />
    );

    const decButton = screen.getByLabelText("Decrease quantity");
    await user.click(decButton);

    expect(mockOnDecQty).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it("does not call onToggle when decrementing from qtySelected > 1 for ERC1155", async () => {
    const user = userEvent.setup();
    const mockOnToggle = jest.fn();
    const mockOnDecQty = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        selected={true}
        onToggle={mockOnToggle}
        onIncQty={() => {}}
        onDecQty={mockOnDecQty}
        copiesMax={5}
        qtySelected={3}
      />
    );

    const decButton = screen.getByLabelText("Decrease quantity");
    await user.click(decButton);

    expect(mockOnDecQty).toHaveBeenCalledTimes(1);
    expect(mockOnToggle).not.toHaveBeenCalled();
  });

  it("does not call onIncQty when qtySelected equals copiesMax", async () => {
    const user = userEvent.setup();
    const mockOnIncQty = jest.fn();

    render(
      <UserPageCollectedCard
        card={memeCard}
        contractType={ContractType.ERC1155}
        showDataRow={true}
        interactiveMode="select"
        selected={true}
        onToggle={() => {}}
        onIncQty={mockOnIncQty}
        onDecQty={() => {}}
        copiesMax={3}
        qtySelected={3}
      />
    );

    const incButton = screen.getByLabelText("Increase quantity");
    await user.click(incButton);

    expect(mockOnIncQty).not.toHaveBeenCalled();
  });
});
