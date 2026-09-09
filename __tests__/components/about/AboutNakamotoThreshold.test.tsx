import { render, screen } from "@testing-library/react";

import AboutNakamotoThreshold from "@/components/about/AboutNakamotoThreshold";

describe("AboutNakamotoThreshold", () => {
  it("uses the shared About heading scale and sticky section title rail", () => {
    const { container } = render(<AboutNakamotoThreshold />);

    const pageHeading = screen.getByRole("heading", {
      level: 1,
      name: "Nakamoto Threshold",
    });
    const introHeading = screen.getByRole("heading", {
      level: 2,
      name: "What is the Nakamoto Threshold?",
    });

    expect(pageHeading).toHaveClass(
      "tw-text-3xl",
      "tw-font-semibold",
      "md:tw-text-4xl"
    );
    expect(pageHeading.parentElement).not.toHaveClass("lg:tw-sticky");
    expect(introHeading).toHaveClass("tw-text-xl", "tw-leading-7");

    const labelledSections = Array.from(
      container.querySelectorAll("article > section[aria-labelledby]")
    );
    expect(labelledSections).toHaveLength(13);

    labelledSections.forEach((section) => {
      const heading = section.querySelector("h2");
      expect(heading).toHaveClass("tw-text-xl", "tw-leading-7");
      expect(heading?.parentElement).toHaveClass(
        "lg:tw-sticky",
        "lg:tw-top-28"
      );
    });

    const headingIds = labelledSections.map((section) =>
      section.getAttribute("aria-labelledby")
    );

    expect(new Set(headingIds).size).toBe(13);
    headingIds.forEach((headingId) => {
      expect(document.getElementById(headingId!)).toBeInTheDocument();
    });
  });

  it("provides descriptive alternative text for all editorial images", () => {
    render(<AboutNakamotoThreshold />);

    expect(screen.getByAltText("Meme Card #4")).toBeInTheDocument();
    expect(screen.getByAltText("the first Rare Pepe")).toBeInTheDocument();
    expect(
      screen.getByAltText(
        "Ethereum faced an important decision of this nature in 2016."
      )
    ).toBeInTheDocument();
  });
});
