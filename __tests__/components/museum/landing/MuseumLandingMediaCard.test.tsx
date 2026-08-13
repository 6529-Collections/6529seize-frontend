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
});
