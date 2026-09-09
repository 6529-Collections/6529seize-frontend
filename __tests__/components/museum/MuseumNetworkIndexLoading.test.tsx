import { render, screen } from "@testing-library/react";
import { MuseumNetworkIndexLoading } from "@/components/museum/MuseumNetworkIndexLoading";

describe("MuseumNetworkIndexLoading", () => {
  it("reserves the artist index without exposing publication content", () => {
    render(<MuseumNetworkIndexLoading kind="artists" />);

    expect(
      screen.getByTestId("museum-network-artists-loading")
    ).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("heading", { name: "Artists" })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading the Museum publication…"
    );
    expect(screen.queryByText(/governance/i)).not.toBeInTheDocument();
  });

  it("reserves the acquisitions index with stable list geometry", () => {
    render(<MuseumNetworkIndexLoading kind="acquisitions" />);

    expect(
      screen.getByTestId("museum-network-acquisitions-loading")
    ).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("heading", { name: "Acquisitions" })
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading the Museum publication…"
    );
  });
});
