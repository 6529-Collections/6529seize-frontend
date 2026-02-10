import NextGenTraitSets from "@/components/nextGen/collections/collectionParts/NextGenTraitSets";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("react-bootstrap", () => {
  const RB: any = {
    Container: (p: any) => <div {...p} />,
    Row: (p: any) => <div {...p} />,
    Col: (p: any) => <div {...p} />,
  };
  const Accordion: any = (p: any) => <div {...p} />;
  Accordion.Item = (p: any) => <div {...p} />;
  Accordion.Button = (p: any) => <button {...p} />;
  Accordion.Body = (p: any) => <div {...p} />;
  RB.Accordion = Accordion;
  return RB;
});

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
      endpoint: `nextgen/collections/${collection.id}/trait_sets/Palette?&page_size=10&page=1`,
    });

    await screen.findByText("alice");
    expect(screen.getByText("Collectors Count: 1")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });
});
