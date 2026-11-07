import { render, screen, within } from "@testing-library/react";
import AboutTermsOfService from "@/components/about/AboutTermsOfService";

const SANCTIONED_PARTIES_TEXT =
  "As we prefer not to go to jail, if you are a Sanctioned Party, we cannot engage in any economic activities with you.";
const EMBARGOED_REGIONS_TEXT =
  'The United States also prohibits doing business with anyone in certain countries and regions under comprehensive US sanctions ("Embargoed Regions"), currently Cuba, Iran, North Korea, and the Crimea, Donetsk and Luhansk regions of Ukraine. As we prefer not to go to jail, Our Platform is not available in Embargoed Regions.';
const WALLET_SCREENING_TEXT =
  "We also check wallet addresses against public sanctions lists published by the United States and other governments. If a wallet linked to your profile appears on one of these lists, your profile cannot sign in or take actions on Our Platform. If you think we made a mistake, contact us at support@6529.io and we will review it.";
const DO_NOT_TRANSACT_TEXT =
  "If you are a Sanctioned Party, please do not: a) mint a 6529 NFT, b) apply to be a Meme Card artist, or c) send us any ETH, for royalties or otherwise.";

function normalizeWhitespace(text: string | null | undefined): string {
  return (text ?? "").replaceAll(/\s+/g, " ").trim();
}

describe("AboutTermsOfService", () => {
  it("renders the extracted definitions without changing the legal content", () => {
    render(<AboutTermsOfService />);

    expect(
      screen.getByText("Abbreviations Make Documents More Readable")
    ).toBeInTheDocument();
    expect(screen.getByText(/Terms of Service/)).toBeInTheDocument();
    expect(
      screen.getByText(/publicly accessible secondary functions/)
    ).toBeInTheDocument();
  });

  it("shows the latest Last Updated date", () => {
    render(<AboutTermsOfService />);

    expect(
      screen.getByText("Last Updated: November 6, 2026")
    ).toBeInTheDocument();
  });

  it("adds embargoed regions and wallet screening to the Sanctions section in order", () => {
    render(<AboutTermsOfService />);

    const sanctionsSection = screen.getByText("Sanctions").closest("li");
    expect(sanctionsSection).not.toBeNull();

    const sectionText = normalizeWhitespace(sanctionsSection?.textContent);
    const orderedParagraphs = [
      SANCTIONED_PARTIES_TEXT,
      EMBARGOED_REGIONS_TEXT,
      WALLET_SCREENING_TEXT,
      DO_NOT_TRANSACT_TEXT,
    ];
    const positions = orderedParagraphs.map((paragraph) =>
      sectionText.indexOf(paragraph)
    );

    positions.forEach((position) => expect(position).toBeGreaterThan(-1));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("links the sanctions appeal contact address as a focusable mailto link", () => {
    render(<AboutTermsOfService />);

    const sanctionsSection = screen.getByText("Sanctions").closest("li");
    expect(sanctionsSection).not.toBeNull();

    const supportLink = within(sanctionsSection as HTMLElement).getByRole(
      "link",
      { name: "support@6529.io" }
    );
    expect(supportLink).toHaveAttribute("href", "mailto:support@6529.io");

    supportLink.focus();
    expect(supportLink).toHaveFocus();
  });
});
