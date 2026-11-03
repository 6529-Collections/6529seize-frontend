import { render, screen } from "@testing-library/react";

import { FOLLOW_THE_REPO_WAVE_URL } from "@/components/about/tech/reports";
import TechReportPage from "@/components/about/tech/TechReportPage";

jest.mock("@/components/about/tech/TechReportMarkdown", () => ({
  __esModule: true,
  default: () => <div data-testid="tech-report-markdown" />,
}));

describe("TechReportPage", () => {
  it("points live updates to Follow The Repo with message-backed copy", () => {
    render(<TechReportPage />);

    const followTheRepoLink = screen.getByRole("link", {
      name: "Follow The Repo",
    });

    expect(followTheRepoLink).toHaveAttribute("href", FOLLOW_THE_REPO_WAVE_URL);
    expect(followTheRepoLink).toHaveAttribute("target", "_blank");
    expect(followTheRepoLink.closest("p")).toHaveTextContent(
      "For live updates, see Follow The Repo, the dev team's live chat. Anyone can read it, and its subwaves carry the deploy and GitHub PR feeds."
    );
  });
});
