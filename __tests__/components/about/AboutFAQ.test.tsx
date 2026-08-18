import { render, screen } from "@testing-library/react";

import AboutFAQ from "@/components/about/AboutFAQ";

describe("AboutFAQ", () => {
  it("presents every question as an unnumbered heading", () => {
    const { container } = render(<AboutFAQ />);

    expect(
      screen.getByRole("heading", { level: 2, name: "What is 6529?" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "How do I get started?" })
    ).toBeInTheDocument();
    expect(container.querySelector("ol[start]")).not.toBeInTheDocument();
  });

  it("uses the profile image's intrinsic dimensions", () => {
    render(<AboutFAQ />);

    const profileImage = screen.getByAltText("6529 profile view");

    expect(profileImage).toHaveAttribute("width", "2076");
    expect(profileImage).toHaveAttribute("height", "846");
  });

  it("makes the wallet anchor target programmatically focusable", () => {
    render(<AboutFAQ />);

    expect(document.querySelector("#what-is-a-wallet")).toHaveAttribute(
      "tabindex",
      "-1"
    );
  });
});
