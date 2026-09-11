import CollectTdhBrowseContext from "@/components/collect/CollectTdhBrowseContext";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import {
  ApiCollectTdhListingsStatusEnum,
  type ApiCollectTdhListings,
} from "@/generated/models/ApiCollectTdhListings";
import { fireEvent, render, screen } from "@testing-library/react";

const snapshot: ApiCollectTdhListings = {
  entries: [],
  family: ApiCollectFamily.Memes,
  next: null,
  snapshot_id: "snapshot",
  catalog_version: "catalog",
  observed_at: "2026-09-11T22:00:00Z",
  status: ApiCollectTdhListingsStatusEnum.Fresh,
  indexed_ask_count: 200,
  evaluated_ask_count: 200,
  ranked_nft_count: 100,
  coverage_complete: true,
  source: "OpenSea indexed listings",
};

it("explains the base-rate comparison without asking for a budget or time horizon", () => {
  render(<CollectTdhBrowseContext snapshot={snapshot} locale="en-US" />);
  expect(
    screen.getByText("Ranked by base TDH/day per ETH.")
  ).toBeInTheDocument();
  expect(screen.getByText("How TDH value works")).toBeInTheDocument();
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  expect(
    screen.getByText(/seller’s accumulated TDH does not transfer/)
  ).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("opens the separate profile projection only on an explicit action", () => {
  const onOpenProjection = jest.fn();
  render(
    <CollectTdhBrowseContext
      snapshot={snapshot}
      locale="en-US"
      onOpenProjection={onOpenProjection}
    />
  );
  expect(onOpenProjection).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Project profile TDH" }));
  expect(onOpenProjection).toHaveBeenCalledTimes(1);
});

it("shows stale pricing and incomplete index coverage without presenting fresh exhaustive liquidity", () => {
  render(
    <CollectTdhBrowseContext
      snapshot={{
        ...snapshot,
        status: ApiCollectTdhListingsStatusEnum.Stale,
        coverage_complete: false,
      }}
      locale="de-DE"
    />
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "awaiting a market refresh"
  );
  expect(
    screen.getByText(/bounded portion of the indexed collection/)
  ).toBeInTheDocument();
});
