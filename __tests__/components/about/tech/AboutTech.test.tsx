import { render, screen } from "@testing-library/react";

import AboutTech from "@/components/about/tech/AboutTech";
import { FOLLOW_THE_REPO_WAVE_URL } from "@/components/about/tech/reports";

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

  it("describes Follow The Repo as the dev team's live chat with feed subwaves", () => {
    render(<AboutTech />);

    const followTheRepoLink = screen.getByRole("link", {
      name: "Follow The Repo",
    });

    expect(followTheRepoLink).toHaveAttribute("href", FOLLOW_THE_REPO_WAVE_URL);
    expect(followTheRepoLink.closest("li")).toHaveTextContent(
      "Follow The Repo is the dev team's live chat. Anyone can read it, and its subwaves carry the deploy and GitHub PR feeds."
    );
  });
});
