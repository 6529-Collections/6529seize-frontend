import StandaloneTheMemesMintPageClient from "../../standalone/standalone-memes-mint/src/app/StandaloneTheMemesMintPageClient";
import { useNowMinting } from "@/hooks/useNowMinting";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/hooks/useNowMinting", () => ({
  useNowMinting: jest.fn(),
}));

jest.mock("@/styles/Home.module.scss", () => ({ main: "main-class" }));

describe("StandaloneTheMemesMintPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a placeholder when mint NFT is not yet available", () => {
    (useNowMinting as jest.Mock).mockReturnValue({
      nft: undefined,
      isFetched: false,
      isFetching: true,
      isLoading: true,
      error: null,
    });

    render(<StandaloneTheMemesMintPageClient />);

    expect(screen.getByText("loads")).toBeInTheDocument();
  });

  it("shows a loading spinner while the mint query is in flight", () => {
    (useNowMinting as jest.Mock).mockReturnValue({
      nft: { id: 123 },
      isFetched: false,
      isFetching: true,
      isLoading: true,
      error: null,
    });

    render(<StandaloneTheMemesMintPageClient />);

    expect(screen.getByRole("img", { name: /loading/i })).toBeInTheDocument();
  });

  it("shows an error state when the latest mint fetch fails", () => {
    (useNowMinting as jest.Mock).mockReturnValue({
      nft: { id: 1 },
      isFetched: true,
      isFetching: false,
      isLoading: false,
      error: new Error("boom"),
    });

    render(<StandaloneTheMemesMintPageClient />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("shows an empty state when no mint information is returned", () => {
    (useNowMinting as jest.Mock).mockReturnValue({
      nft: { id: 1 },
      isFetched: true,
      isFetching: false,
      isLoading: false,
      error: undefined,
    });

    render(<StandaloneTheMemesMintPageClient />);

    expect(
      screen.getByText(
        /No mint information found\. We could not load the current mint\. Try again later\./
      )
    ).toBeInTheDocument();
  });
});
