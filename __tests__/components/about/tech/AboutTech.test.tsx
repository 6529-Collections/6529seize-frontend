import { render, screen } from "@testing-library/react";

import AboutTech from "@/components/about/tech/AboutTech";

describe("AboutTech", () => {
  it("makes the wallet authentication note card clickable", () => {
    render(<AboutTech />);

    const noteLink = screen.getByRole("link", {
      name: /wallet authentication upgrade/i,
    });

    expect(noteLink).toHaveAttribute(
      "href",
      "/about/tech/wallet-authentication"
    );
    expect(noteLink).toHaveTextContent(/what is changing/i);
  });
});
