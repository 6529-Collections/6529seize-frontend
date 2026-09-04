import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StreamArtworkConceptPreview } from "@/components/public-review/StreamArtworkConceptPreview";

describe("StreamArtworkConceptPreview", () => {
  it("walks through one fictional artwork without offering a live action", async () => {
    const user = userEvent.setup();
    render(<StreamArtworkConceptPreview />);

    expect(
      screen.getByRole("heading", { name: "Follow one artwork" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "See a Stream artwork" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Nothing here buys, signs, uploads, or saves anything.")
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("img", {
        name: /Signal \/ No\. 1, a fictional abstract artwork/,
      })
    ).toHaveLength(1);
    expect(
      screen.getByRole("region", { name: "Meet the artwork" })
    ).toHaveTextContent("One artwork · one token");
    const viewNavigation = screen.getByRole("navigation", {
      name: "Choose a view in the Stream artwork concept preview",
    });

    await user.click(
      within(viewNavigation).getByRole("button", { name: /Release/ })
    );
    const planView = screen.getByRole("region", {
      name: "The artist sets the release",
    });
    expect(planView).toHaveTextContent("a fixed price of 1.00 ETH");
    expect(planView).toHaveTextContent("90% to Mira · 10% to the studio");

    await user.click(
      within(viewNavigation).getByRole("button", { name: /Artist check/ })
    );
    const approvalView = screen.getByRole("region", {
      name: "The artist checks the exact plan",
    });
    expect(approvalView).toHaveTextContent(
      "If an important detail changes, she must approve again."
    );

    await user.click(
      within(viewNavigation).getByRole("button", { name: /Collector/ })
    );
    const collectorView = screen.getByRole("region", {
      name: "The collector sees the same plan",
    });
    expect(collectorView).toHaveTextContent(
      "Signal / No. 1 · 1 of 1 · 1.00 ETH"
    );
    expect(
      within(collectorView).queryByRole("button", { name: /Buy/ })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next: History" }));
    expect(
      within(viewNavigation).getByRole("button", { name: /History/ })
    ).toHaveFocus();
    const historyView = screen.getByRole("region", {
      name: "The history stays clear",
    });
    expect(historyView).toHaveTextContent(
      "The owner can change. The protected artwork record can later be fixed."
    );

    expect(
      screen.getByRole("link", { name: "Share feedback on this preview" })
    ).toHaveAttribute("href", "#public-review-feedback");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Step 5 of 5: The history stays clear"
    );
  });
});
