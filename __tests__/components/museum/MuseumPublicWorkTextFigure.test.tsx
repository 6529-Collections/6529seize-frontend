import { render, screen } from "@testing-library/react";
import { MuseumPublicWorkTextFigure } from "@/components/museum/MuseumPublicWorkTextFigure";

describe("MuseumPublicWorkTextFigure", () => {
  it("renders a dignified text-only Work state without requesting legacy media", () => {
    render(
      <MuseumPublicWorkTextFigure
        title="CENTURY #31"
        href="/museum/network/works/6529NM-W-0001"
        byline="Casey Reas"
      />
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "No visual presentation is available for this work in the current publication."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CENTURY #31" })).toHaveAttribute(
      "href",
      "/museum/network/works/6529NM-W-0001"
    );
    expect(screen.getByText("Casey Reas")).toBeInTheDocument();
  });
});
