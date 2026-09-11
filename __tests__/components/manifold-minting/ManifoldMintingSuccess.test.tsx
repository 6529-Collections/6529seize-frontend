import ManifoldMintingSuccess from "@/components/manifold-minting/ManifoldMintingSuccess";
import { fireEvent, render, screen } from "@testing-library/react";

const receipt = {
  quantity: 2,
  recipient: "0x0000000000000000000000000000000000000abc",
  artworkName: "Original artwork",
  collectionLabel: "The Memes #547",
};
const transactionUrl = `https://etherscan.io/tx/0x${"a".repeat(64)}`;
const artworkUrl = "https://images.example/original-artwork.png";
const availableArtworkUrl = "https://images.example/available-artwork.png";

describe("ManifoldMintingSuccess", () => {
  it("shows the artwork and opens transaction details in a clearly announced new tab", () => {
    render(
      <ManifoldMintingSuccess
        receipt={{ ...receipt, imageUrl: artworkUrl }}
        transactionUrl={transactionUrl}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("img", { name: receipt.artworkName })
    ).toHaveAttribute("src", artworkUrl);
    const transactionLink = screen.getByRole("link", {
      name: "View transaction Opens in a new tab",
    });
    expect(transactionLink).toHaveAttribute("href", transactionUrl);
    expect(transactionLink).toHaveAttribute("target", "_blank");
    expect(transactionLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it.each([undefined, "", "   "])(
    "retains the receipt and actions when an artwork URL is unavailable (%s)",
    (imageUrl) => {
      render(
        <ManifoldMintingSuccess
          receipt={{ ...receipt, imageUrl }}
          transactionUrl={transactionUrl}
          onClose={jest.fn()}
        />
      );

      expect(
        screen.getByRole("img", { name: "Artwork preview unavailable" })
      ).toBeInTheDocument();
      expect(screen.getByText(receipt.artworkName)).toBeInTheDocument();
      expect(screen.getByText(receipt.recipient)).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
      expect(
        screen.getByRole("link", { name: /View transaction/ })
      ).toHaveAttribute("href", transactionUrl);
    }
  );

  it("falls back after an image fails and can display artwork for a later receipt", () => {
    const { rerender } = render(
      <ManifoldMintingSuccess
        receipt={{ ...receipt, imageUrl: "/unavailable-artwork.png" }}
        transactionUrl={transactionUrl}
        onClose={jest.fn()}
      />
    );

    fireEvent.error(screen.getByRole("img", { name: receipt.artworkName }));
    expect(
      screen.getByRole("img", { name: "Artwork preview unavailable" })
    ).toBeInTheDocument();
    expect(screen.getByText(receipt.recipient)).toBeInTheDocument();

    rerender(
      <ManifoldMintingSuccess
        receipt={{ ...receipt, imageUrl: availableArtworkUrl }}
        transactionUrl={transactionUrl}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("img", { name: receipt.artworkName })
    ).toHaveAttribute("src", availableArtworkUrl);
    expect(
      screen.queryByRole("img", { name: "Artwork preview unavailable" })
    ).not.toBeInTheDocument();
  });
});
