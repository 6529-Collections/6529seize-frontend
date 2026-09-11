import NextGenTraitSets from "@/components/nextGen/collections/collectionParts/NextGenTraitSets";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/components/collect/CollectEntryLink", () => ({
  __esModule: true,
  default: () => <a href="/collect">Collect</a>,
}));

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (p: any) => <svg data-testid="fa" {...p} />,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img alt={props.alt ?? ""} {...props} />
  ),
}));

jest.mock("@/components/dotLoader/DotLoader", () => () => (
  <div data-testid="loader" />
));

jest.mock("@/helpers/AllowlistToolHelpers", () => ({
  getRandomObjectId: () => "id",
}));

jest.mock("@/components/nextGen/nextgen_helpers", () => ({
  formatNameForUrl: (s: string) => s,
  normalizeNextgenTokenID: (id: number) => ({ token_id: id }),
}));

const { commonApiFetch } = require("@/services/api/common-api");

const collection = { id: 1, name: "Collection" } as any;

function setup(traits: any, response: any) {
  (commonApiFetch as jest.Mock).mockReset();
  (commonApiFetch as jest.Mock).mockResolvedValue({});
  (commonApiFetch as jest.Mock)
    .mockResolvedValueOnce(traits)
    .mockResolvedValueOnce(response);
  render(<NextGenTraitSets collection={collection} preview />);
  return waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(2));
}

describe("NextGenTraitSets", () => {
  it("distinguishes unavailable profile coverage from an empty collection and retries", async () => {
    const user = userEvent.setup();
    let fail = true;
    commonApiFetch.mockReset();
    commonApiFetch.mockImplementation(({ endpoint }: { endpoint: string }) => {
      if (endpoint.endsWith("/traits"))
        return Promise.resolve([{ trait: "Palette", values: ["Red"] }]);
      return fail
        ? Promise.reject(new Error("unavailable"))
        : Promise.resolve({ count: 0, data: [] });
    });
    render(<NextGenTraitSets collection={collection} preview />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your collection could not be checked"
    );
    expect(
      screen.queryByText("No trait sets match the selected filters.")
    ).not.toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText("No trait sets match the selected filters.")
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("shows complete trait set message when all values seized", async () => {
    await setup([{ trait: "Palette", values: ["Red", "Blue"] }], {
      count: 1,
      data: [
        {
          owner: "0x1",
          normalised_handle: "alice",
          handle: "alice",
          level: 1,
          tdh: 1,
          rep_score: 0,
          consolidation_display: "",
          distinct_values_count: 2,
          token_values: [
            { value: "Red", tokens: [1] },
            { value: "Blue", tokens: [2] },
          ],
        },
      ],
    });

    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `nextgen/collections/${collection.id}/traits`,
    });
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: `nextgen/collections/${collection.id}/trait_sets/Palette?page_size=10&page=1`,
    });

    await screen.findByText("alice");
    expect(screen.getByText("Collector profiles: 1")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("shows one completed profile with separate custody wallets for its Pebbles", async () => {
    const walletA = "0x0000000000000000000000000000000000000011";
    const walletB = "0x0000000000000000000000000000000000000022";
    await setup([{ trait: "Palette", values: ["Red", "Blue"] }], {
      count: 1,
      data: [
        {
          account_key: `${walletA}-${walletB}`,
          profile_id: "profile",
          owner: walletA,
          handle: "alice",
          normalised_handle: "alice",
          level: 1,
          distinct_values_count: 2,
          custody_wallets: [walletA, walletB],
          trait_sets: { palette: 2 },
          token_values: [
            {
              value: "Red",
              tokens: [1],
              token_owners: [{ token_id: 1, wallet: walletA }],
            },
            {
              value: "Blue",
              tokens: [2],
              token_owners: [{ token_id: 2, wallet: walletB }],
            },
          ],
        },
      ],
    });
    expect(screen.getByText("Collector profiles: 1")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Set coverage includes all confirmed wallets in each profile."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /alice$/ })).toHaveAttribute(
      "href",
      "/alice"
    );
    expect(
      screen.getByRole("link", {
        hidden: true,
        name: `Collection #1, held by ${walletA}`,
      })
    ).toHaveAttribute("href", "/nextgen/token/1");
    expect(
      screen.getByRole("link", {
        hidden: true,
        name: `Collection #2, held by ${walletB}`,
      })
    ).toHaveAttribute("href", "/nextgen/token/2");
  });

  it("renders the canonical Ultimate facet counts without treating trait_sets as a count", async () => {
    const user = userEvent.setup();
    await setup([{ trait: "Palette", values: ["Red", "Blue"] }], {
      count: 0,
      data: [],
    });
    commonApiFetch.mockResolvedValueOnce({
      count: 1,
      data: [
        {
          account_key: "account",
          owner: "0x1",
          handle: "alice",
          normalised_handle: "alice",
          level: 1,
          trait_sets: { palette: 2, size: 3, traced: 2 },
          palette_sets: 2,
          size_sets: 3,
          traced_sets: 2,
          token_values: [],
        },
      ],
    });
    await user.click(screen.getByRole("button", { name: "Ultimate" }));
    expect(await screen.findByText("Palette values: 2")).toBeInTheDocument();
    expect(screen.getByText("Size values: 3")).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });

  it("shows an empty state without requesting undefined trait sets", async () => {
    const unsupportedCollection = { id: 999, name: "Unsupported" } as any;
    (commonApiFetch as jest.Mock).mockReset();
    (commonApiFetch as jest.Mock).mockResolvedValueOnce([]);

    render(<NextGenTraitSets collection={unsupportedCollection} preview />);

    expect(
      await screen.findByText(
        "No trait sets are configured for this collection."
      )
    ).toBeInTheDocument();
    expect(commonApiFetch).toHaveBeenCalledTimes(1);
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "nextgen/collections/999/traits",
    });
    expect(screen.queryByText(/Unique values for/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Collector profiles:/)).not.toBeInTheDocument();
  });
});
