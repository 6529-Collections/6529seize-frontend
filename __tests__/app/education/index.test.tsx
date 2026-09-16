import EducationPage from "@/app/education/page";
import { educationMigratedWordPressPage } from "@/app/education/content";
import { render, screen } from "@testing-library/react";

describe("EducationPage", () => {
  it("connects the education library to current first-party context", () => {
    render(<EducationPage />);

    expect(
      screen.getByRole("link", { name: "Open Metaverse overview" })
    ).toHaveAttribute("href", "/about/open-metaverse");
    expect(
      screen.getByRole("link", { name: "6529 Network Museum" })
    ).toHaveAttribute("href", "/museum/network/about");
    expect(
      screen.getByRole("link", { name: "permanent collection" })
    ).toHaveAttribute("href", "/museum/network/collection");
    expect(
      screen.getByRole("link", { name: "Museum research hub" })
    ).toHaveAttribute("href", "/museum/network/research");
    expect(
      screen.getByRole("link", { name: "send a collaboration inquiry" })
    ).toHaveAttribute("href", "/education/education-collaboration-form");
  });

  it("does not retain obsolete future-facing promises", () => {
    const html = educationMigratedWordPressPage.blocks.reduce(
      (content, block) =>
        block.type === "html" ? `${content} ${block.html}` : content,
      ""
    );

    expect(html).not.toContain("next couple of months");
    expect(html).not.toContain("Stay tuned");
    expect(html).toContain("once they are aware of their choices");
    expect(html).toContain(
      "podcast entries also retain their publication dates"
    );
  });
});
