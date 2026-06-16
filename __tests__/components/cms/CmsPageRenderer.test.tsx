import { render, screen } from "@testing-library/react";

import CmsPageRenderer from "@/components/cms/public/CmsPageRenderer";
import { cmsFixturePackages } from "@/lib/cms/fixtures";

describe("CmsPageRenderer", () => {
  it("renders a wallet gallery package from fixture data", () => {
    render(<CmsPageRenderer cmsPackage={cmsFixturePackages.gallery} />);

    expect(
      screen.getByRole("heading", { name: "Collected Signals" })
    ).toBeInTheDocument();
    expect(screen.getByText("Wallet gallery snapshot")).toBeInTheDocument();
    expect(screen.getAllByText("The Memes").length).toBeGreaterThan(0);
    expect(screen.getByText("6529 Gradients")).toBeInTheDocument();
    expect(screen.getByLabelText("CMS package evidence")).toHaveTextContent(
      cmsFixturePackages.gallery.package_hash
    );
  });

  it("renders transaction references as explained chain evidence", () => {
    render(<CmsPageRenderer cmsPackage={cmsFixturePackages.transaction} />);

    expect(
      screen.getByRole("heading", {
        name: "A transaction page should explain the event first",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "The wallet transferred a 6529 Meme Card to a new collecting wallet and paid normal Ethereum gas."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Transferred The Memes token #1.")
    ).toBeInTheDocument();
  });
});
