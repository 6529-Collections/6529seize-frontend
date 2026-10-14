import { fireEvent, render, screen } from "@testing-library/react";
import { TokenThumbnail } from "@/components/token-list/components/TokenThumbnail";
import type { TokenMetadata } from "@/types/nft";

const metadata: TokenMetadata = {
  tokenId: 5n,
  tokenIdRaw: "5",
  name: "Embed Example",
  imageUrl:
    "https://nft2-cdn.alchemy.com/cdn-cgi/image/width=250,height=250,fit=scale-down/eth-mainnet/a3062b74e1b4d79fdab0ca1ec5a92615",
  collectionName: "EmblemOpen",
  isSpam: false,
};
const props = { decimalId: "5", isLoading: false, hasError: false };

describe("TokenThumbnail", () => {
  it("replaces a failed image with the existing error tile and retries a new source", () => {
    const { rerender } = render(
      <TokenThumbnail {...props} metadata={metadata} />
    );
    fireEvent.error(screen.getByRole("img", { name: "Embed Example" }));
    expect(screen.queryByAltText("Embed Example")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Failed to load thumbnail" })
    ).toHaveTextContent("Load Error");

    rerender(
      <TokenThumbnail {...props} metadata={{ ...metadata }} isLoading />
    );
    expect(screen.queryByAltText("Embed Example")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Failed to load thumbnail" })
    ).toBeInTheDocument();

    rerender(
      <TokenThumbnail
        {...props}
        metadata={{
          ...metadata,
          imageUrl: "https://res.cloudinary.com/alchemyapi/replacement.png",
        }}
      />
    );
    expect(
      screen.getByRole("img", { name: "Embed Example" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Failed to load thumbnail" })
    ).not.toBeInTheDocument();
  });

  it("keeps metadata loading, error, and missing-artwork states distinct", () => {
    const { rerender } = render(<TokenThumbnail {...props} isLoading />);
    expect(screen.getByLabelText("Loading thumbnail")).toBeInTheDocument();
    rerender(<TokenThumbnail {...props} hasError />);
    expect(
      screen.getByRole("img", { name: "Failed to load thumbnail" })
    ).toBeInTheDocument();
    rerender(
      <TokenThumbnail {...props} metadata={{ ...metadata, imageUrl: null }} />
    );
    expect(screen.getByText("#5")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("keeps available artwork during metadata refresh errors", () => {
    render(
      <TokenThumbnail {...props} metadata={metadata} isLoading hasError />
    );
    expect(
      screen.getByRole("img", { name: "Embed Example" })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Loading thumbnail")
    ).not.toBeInTheDocument();
  });

  it.each(["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const)(
    "provides the error fallback in %s",
    (locale) => {
      render(<TokenThumbnail {...props} locale={locale} hasError />);
      expect(
        screen.getByRole("img", { name: "Failed to load thumbnail" })
      ).toHaveTextContent("Load Error");
    }
  );
});
