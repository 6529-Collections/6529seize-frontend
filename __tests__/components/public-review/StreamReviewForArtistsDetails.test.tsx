import { render, screen } from "@testing-library/react";

import { StreamReviewForArtistsDetails } from "@/components/public-review/StreamReviewForArtistsDetails";

describe("StreamReviewForArtistsDetails", () => {
  it("keeps the full technical review in plain language", () => {
    const { container } = render(<StreamReviewForArtistsDetails />);

    expect(
      screen.getByRole("heading", { name: "How to read the details" })
    ).toBeInTheDocument();
    expect(container.querySelectorAll("section[id]")).toHaveLength(15);
    expect(
      screen.getByRole("heading", {
        name: "Your collection has a durable identity",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Questions for artists" })
    ).toBeInTheDocument();
  });

  it("separates current code from accepted and proposed design", () => {
    render(<StreamReviewForArtistsDetails />);

    expect(screen.getAllByText("Reviewed code").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Accepted design").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Still proposed").length).toBeGreaterThan(1);
    expect(
      screen.getByText(
        "ADR 0022's registry and helper design is still proposed. It is not approved or implemented."
      )
    ).toBeInTheDocument();
  });

  it("states the narrow approval, sale, royalty, and finality limits", () => {
    render(<StreamReviewForArtistsDetails />);

    expect(screen.getByText("Maximum collection purchases")).toBeInTheDocument();
    expect(
      screen.getByText(/one authorization can mint only one token/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/reviewed sale paths use ETH/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Marketplaces choose whether to pay it/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/has not yet proved that every artwork-changing path/i)
    ).toBeInTheDocument();
  });
});
