import { render, screen } from "@testing-library/react";

import AboutNakamotoThreshold from "@/components/about/AboutNakamotoThreshold";

describe("AboutNakamotoThreshold", () => {
  it("uses the TDH editorial heading scale and sticky title rail", () => {
    render(<AboutNakamotoThreshold />);

    const pageHeading = screen.getByRole("heading", {
      level: 1,
      name: "Nakamoto Threshold",
    });
    const sectionHeadings = screen.getAllByRole("heading", { level: 2 });

    expect(pageHeading).toHaveClass("tw-text-lg", "sm:tw-text-xl");
    expect(pageHeading.parentElement).toHaveClass(
      "lg:tw-sticky",
      "lg:tw-top-28"
    );
    expect(sectionHeadings).toHaveLength(13);

    sectionHeadings.forEach((heading) => {
      expect(heading).toHaveClass("tw-text-lg", "sm:tw-text-xl");
      expect(heading.parentElement).toHaveClass("lg:tw-sticky", "lg:tw-top-28");
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
