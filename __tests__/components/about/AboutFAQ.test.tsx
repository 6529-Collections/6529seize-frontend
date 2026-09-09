import { render, screen } from "@testing-library/react";

import AboutFAQ from "@/components/about/AboutFAQ";

describe("AboutFAQ", () => {
  it("presents every question as an unnumbered heading", () => {
    const { container } = render(<AboutFAQ />);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent)
    ).toEqual([
      "What is 6529?",
      "How do I get started?",
      "What are Waves?",
      "What is my profile?",
      "How does the system work overall?",
      "Why do Memes matter?",
      "What are The Memes?",
      "Why would I collect Meme Cards?",
      "How do Meme drops work?",
      "Do Meme Cards have utility?",
      "How do I participate beyond collecting?",
      "What is the long-term vision?",
      "How does everything fit together?",
      "What are Gradients?",
      "What is NextGen?",
      "What are ReMemes?",
      "What is the Meme Lab?",
      "Bonus track",
      "What is a Wallet?",
    ]);

    const questionContainer = container.querySelector(
      "article > div > section:first-child"
    );
    expect(questionContainer?.firstElementChild?.tagName).toBe("UL");
  });

  it("uses the profile image's intrinsic dimensions", () => {
    render(<AboutFAQ />);

    const profileImage = screen.getByAltText("6529 profile view");

    expect(profileImage).toHaveAttribute("width", "2076");
    expect(profileImage).toHaveAttribute("height", "846");
  });

  it("makes the wallet anchor target programmatically focusable", () => {
    render(<AboutFAQ />);

    expect(document.querySelector("section#what-is-a-wallet")).toHaveAttribute(
      "tabindex",
      "-1"
    );
  });
});
