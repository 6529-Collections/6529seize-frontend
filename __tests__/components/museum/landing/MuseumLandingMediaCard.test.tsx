import { render, screen } from "@testing-library/react";
import { MuseumLandingMediaCard } from "@/components/museum/landing/MuseumLandingMediaCard";

describe("MuseumLandingMediaCard", () => {
  it("shows an accession presentation image immediately on a Collection card", () => {
    render(
      <MuseumLandingMediaCard
        title="Palmyra, Syria"
        subtitle="Lorenzo Meloni"
        media={{
          kind: "proposal",
          src: "https://museum.test/palmyra.jpg",
          width: 2400,
          height: 1600,
          alt: "Palmyra by Lorenzo Meloni",
          sourceByteSize: 16_900_000,
          creditLine: "© Lorenzo Meloni/Magnum Photos 2022.",
          requireIntentForLargeSource: false,
        }}
      />
    );

    expect(
      screen.getByRole("img", { name: "Palmyra by Lorenzo Meloni" })
    ).toHaveAttribute("src", "https://museum.test/palmyra.jpg");
    expect(
      screen.queryByRole("button", { name: /loads 16\.9 MB/u })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("© Lorenzo Meloni/Magnum Photos 2022.")
    ).toBeInTheDocument();
  });

  it("keeps status in the open caption without adding a second card surface", () => {
    render(
      <MuseumLandingMediaCard
        title="Keys and Gates"
        subtitle="Selected works"
        status="Selected through an acquisition program; unminted"
      />
    );

    const hasBorderClass = (element: Element | null) =>
      element !== null &&
      Array.from(element.classList).some(
        (className) =>
          className === "tw-border" || className.startsWith("tw-border-")
      );

    const card = screen.getByTestId("museum-landing-media-card");
    expect(card).toHaveTextContent(
      "Selected through an acquisition program; unminted"
    );
    expect(hasBorderClass(card)).toBe(false);
    expect(hasBorderClass(card.querySelector("figcaption"))).toBe(false);
  });
});
