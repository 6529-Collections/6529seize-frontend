import StandaloneTheMemesMintPageClient from "../../standalone/standalone-memes-mint/src/app/StandaloneTheMemesMintPageClient";
import { useNowMinting } from "@/hooks/useNowMinting";
import { render, screen } from "@testing-library/react";
import React from "react";

jest.mock("@/hooks/useNowMinting", () => ({
  useNowMinting: jest.fn(),
}));

jest.mock("@/components/the-memes/TheMemesMint", () => ({
  __esModule: true,
  default: (props: { nft: { id: number }; standalone?: boolean }) => (
    <div data-testid="the-memes-mint">
      nft-{props.nft.id}-{String(props.standalone)}
    </div>
  ),
}));

jest.mock("@/styles/Home.module.scss", () => ({ main: "main-class" }));

describe("StandaloneTheMemesMintPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a loading state while the latest mint is being fetched", () => {
    (useNowMinting as jest.Mock).mockReturnValue({
      nft: undefined,
      isFetched: false,
      isFetching: true,
      isLoading: true,
      error: null,
    });

    render(<StandaloneTheMemesMintPageClient />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /loading/i })).toBeInTheDocument();
  });

  it("renders the mint page once the latest nft is loaded", () => {
    (useNowMinting as jest.Mock).mockReturnValue({
      nft: { id: 123 },
      isFetched: true,
      isFetching: false,
      isLoading: false,
      error: null,
    });

    render(<StandaloneTheMemesMintPageClient />);

    expect(screen.getByTestId("the-memes-mint")).toHaveTextContent(
      "nft-123-true"
    );
  });

  it("shows an error state when the latest mint fetch fails", () => {
    (useNowMinting as jest.Mock).mockReturnValue({
      nft: undefined,
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
      nft: undefined,
      isFetched: true,
      isFetching: false,
      isLoading: false,
      error: undefined,
    });

    render(<StandaloneTheMemesMintPageClient />);

    expect(screen.getByText("No mint information found")).toBeInTheDocument();
  });
});
