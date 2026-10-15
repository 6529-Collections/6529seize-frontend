import Footer from "@/components/footer/Footer";
import { AboutSection } from "@/types/enums";
import { render, screen } from "@testing-library/react";

describe("Footer", () => {
  it("uses the subdued page-shell border", () => {
    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toHaveClass("tw-border-iron-900");
  });

  it("renders social links with images", () => {
    render(<Footer />);
    const punk = screen.getByRole("link", { name: /@punk6529/i });
    expect(punk).toHaveAttribute("href", "https://x.com/punk6529");
    const collections = screen.getByRole("link", { name: /@6529Collections/i });
    expect(collections).toHaveAttribute(
      "href",
      "https://x.com/6529Collections"
    );
    const github = screen.getByRole("link", { name: /6529-Collections/i });
    expect(github).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections"
    );
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);
    expect(punk.parentElement?.textContent).not.toContain("||");
  });

  it("lazy-loads the below-the-fold social icons so they are not preloaded on every page", () => {
    render(<Footer />);

    // React hoists eager <img> tags into the early-hints Link header; the
    // footer icons sit below the fold and must stay out of it.
    const images = screen.getAllByRole("img");
    expect(images.map((image) => image.getAttribute("src"))).toEqual([
      "/twitter.png",
      "/twitter.png",
      "/github_w.png",
    ]);
    for (const image of images) {
      expect(image).toHaveAttribute("loading", "lazy");
      expect(image).toHaveAttribute("decoding", "async");
      expect(image).toHaveAttribute("width", "18");
      expect(image).toHaveAttribute("height", "18");
    }
  });

  it("renders policy and contact links", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: "Terms of Service" })
    ).toHaveAttribute("href", `/about/${AboutSection.TERMS_OF_SERVICE}`);
    expect(
      screen.getByRole("link", { name: "Privacy Policy" })
    ).toHaveAttribute("href", `/about/${AboutSection.PRIVACY_POLICY}`);
    expect(screen.getByRole("link", { name: "Copyright" })).toHaveAttribute(
      "href",
      `/about/${AboutSection.COPYRIGHT}`
    );
    expect(screen.getByRole("link", { name: "Cookie Policy" })).toHaveAttribute(
      "href",
      `/about/${AboutSection.COOKIE_POLICY}`
    );
    expect(screen.getByRole("link", { name: "License" })).toHaveAttribute(
      "href",
      `/about/${AboutSection.LICENSE}`
    );
    expect(screen.getByRole("link", { name: "API" })).toHaveAttribute(
      "href",
      "/tools/api"
    );
    expect(screen.getByRole("link", { name: "Contact Us" })).toHaveAttribute(
      "href",
      `/about/${AboutSection.CONTACT_US}`
    );
    expect(screen.getByRole("link", { name: "Status" })).toHaveAttribute(
      "href",
      "https://status.6529.io/"
    );
  });

  it("renders the 6529 Apps link between License and API in the same tab", () => {
    render(<Footer />);

    const licenseLink = screen.getByRole("link", { name: "License" });
    const appsLink = screen.getByRole("link", { name: "6529 Apps" });
    const apiLink = screen.getByRole("link", { name: "API" });

    expect(appsLink).toHaveAttribute("href", "/about/6529-apps");
    expect(appsLink).toHaveAttribute("target", "_self");
    expect(appsLink.previousElementSibling).toHaveTextContent("|");
    expect(appsLink.previousElementSibling?.previousElementSibling).toBe(
      licenseLink
    );
    expect(appsLink.nextElementSibling).toHaveTextContent("|");
    expect(appsLink.nextElementSibling?.nextElementSibling).toBe(apiLink);
  });
});
