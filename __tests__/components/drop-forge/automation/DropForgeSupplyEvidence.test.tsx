import { render, screen } from "@testing-library/react";
import DropForgeSupplyEvidence from "@/components/drop-forge/launch/DropForgeSupplyEvidence";
import { ApiDropForgeSupplyEvidenceStatusEnum as Status } from "@/generated/models/ApiDropForgeSupplyEvidence";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

it("shows mismatched counts and the retry time without claiming a transfer completed", () => {
  render(
    <DropForgeSupplyEvidence
      evidence={{
        status: Status.Waiting,
        checked_at: 1,
        block_number: 100,
        indexed_through: 99,
        rpc_total: 287,
        db_total: 286,
      }}
      retryAt={Date.parse("2026-10-23T15:05:00Z") / 1000}
    />
  );
  expect(
    screen.getByText("Waiting for verified mint accounting")
  ).toBeInTheDocument();
  expect(screen.getByText("287")).toBeInTheDocument();
  expect(screen.getByText("286")).toBeInTheDocument();
  expect(screen.getByText(/Retry eligible at/)).toHaveTextContent(
    "Europe/Athens"
  );
  expect(screen.getByText(/No new transfer is approved/)).toBeInTheDocument();
});
it("preserves unavailable evidence instead of displaying a misleading zero", () => {
  render(
    <DropForgeSupplyEvidence
      evidence={{ status: Status.Waiting, checked_at: 1, rpc_total: 0 }}
    />
  );
  expect(screen.getByText("0")).toBeInTheDocument();
  expect(screen.getAllByText("Unavailable")).toHaveLength(3);
});
it("shows agreement without a retry notice", () => {
  render(
    <DropForgeSupplyEvidence
      evidence={{
        status: Status.Verified,
        checked_at: 1,
        block_number: 100,
        indexed_through: 100,
        rpc_total: 287,
        db_total: 287,
      }}
      retryAt={123}
    />
  );
  expect(
    screen.getByText("RPC and database mint counts agree")
  ).toBeInTheDocument();
  expect(screen.queryByText(/Retry eligible/)).not.toBeInTheDocument();
});
