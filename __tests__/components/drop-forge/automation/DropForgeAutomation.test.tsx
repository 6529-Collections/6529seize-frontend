import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DropForgeAutomationStatus from "@/components/drop-forge/launch/DropForgeAutomationStatus";
import CraftLaunchActions from "@/components/drop-forge/craft/CraftLaunchActions";
import ProcessAndFinalize from "@/components/distribution-plan-tool/review-distribution-plan/ProcessAndFinalize";
import {
  getForgeLaunch,
  requestForgeLaunch,
  latestForgeProcess,
  startForgeProcess,
} from "@/services/api/drop-forge-api";
import type { ApiDropForgeLaunch } from "@/generated/models/ApiDropForgeLaunch";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import type { ApiDropForgeJob } from "@/generated/models/ApiDropForgeJob";
jest.mock("@/services/api/drop-forge-api", () => ({
  getForgeLaunch: jest.fn(),
  requestForgeLaunch: jest.fn(),
  latestForgeProcess: jest.fn(),
  startForgeProcess: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: async () => ({ success: true }) }),
}));
jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => ({ contract: "0xcreator" }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
function renderUI(element: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>{element}</QueryClientProvider>
    ),
  };
}
const launch = (initialized: boolean, metadata = "published") =>
  ({
    id: "launch",
    state: "RUNNING",
    revision: 1,
    chain_id: 1,
    contract: "0xcreator",
    claim_id: 123,
    signer: "signer",
    payment_receiver: "receiver",
    distribution_hash: "hash",
    phases: [],
    updated_at: 1,
    metadata_location: metadata,
    actions: [
      {
        id: "initialize",
        kind: "INITIALIZE",
        state: initialized ? "CONFIRMED" : "PENDING",
        phase: 0,
        due: 1,
        deadline: 100,
        recipients: 0,
      },
    ],
  }) as ApiDropForgeLaunch;
beforeEach(() => jest.clearAllMocks());
it("queues Launch once and shows durable initialization rather than a wallet transaction prompt", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue(null);
  jest.mocked(requestForgeLaunch).mockResolvedValue(launch(false));
  renderUI(
    <CraftLaunchActions claimId={123} metadata="published" dirty={false} />
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Launch" })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Launch" }));
  await waitFor(() =>
    expect(requestForgeLaunch).toHaveBeenCalledWith("0xcreator", 123, false)
  );
  expect(
    await screen.findByRole("button", { name: "Initializing…" })
  ).toBeDisabled();
});
it("offers Update Claim only for republished changes and retains state after loading", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue(launch(true, "old"));
  jest.mocked(requestForgeLaunch).mockResolvedValue({
    ...launch(true, "old"),
    actions: [
      ...launch(true).actions,
      {
        id: "metadata",
        kind: "METADATA",
        state: "PENDING",
        phase: 0,
        due: 1,
        deadline: 100,
        recipients: 0,
      },
    ],
  } as ApiDropForgeLaunch);
  renderUI(<CraftLaunchActions claimId={123} metadata="new" dirty={false} />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Update Claim" })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Update Claim" }));
  expect(
    await screen.findByRole("button", { name: "Updating…" })
  ).toBeDisabled();
  expect(requestForgeLaunch).toHaveBeenCalledWith("0xcreator", 123, true);
});
it("prevents launch for unpublished or unsaved changes", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue(null);
  renderUI(<CraftLaunchActions claimId={123} metadata={null} dirty />);
  await screen.findByText("Save and publish Craft changes before continuing.");
  expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();
  expect(requestForgeLaunch).not.toHaveBeenCalled();
});
it("runs one Process and Finalize operation and restores its completed state on refresh", async () => {
  const job = {
    id: "job",
    contract: "0xcreator",
    claim_id: 123,
    kind: "PROCESS_ALL",
    status: "PENDING",
    step: 0,
    updated_at: 1,
  } as ApiDropForgeJob;
  jest.mocked(latestForgeProcess).mockResolvedValue(null);
  jest.mocked(startForgeProcess).mockResolvedValue(job);
  const mounted = renderUI(
    <ProcessAndFinalize
      contract="0xcreator"
      claim={123}
      plan="plan"
      phaseIds={["p0", "p1", "p2"]}
    />
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Process and Finalize" })
    ).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Process and Finalize" }));
  expect(
    await screen.findByRole("button", { name: "Processing and finalizing…" })
  ).toBeDisabled();
  expect(startForgeProcess).toHaveBeenCalledTimes(1);
  mounted.unmount();
  jest.mocked(latestForgeProcess).mockResolvedValue({
    ...job,
    status: "COMPLETED",
    step: 4,
  } as ApiDropForgeJob);
  renderUI(
    <ProcessAndFinalize
      contract="0xcreator"
      claim={123}
      plan="plan"
      phaseIds={["p0", "p1", "p2"]}
    />
  );
  expect(
    await screen.findByRole("button", {
      name: "Completed — lists are ready to download.",
    })
  ).toBeDisabled();
  expect(startForgeProcess).toHaveBeenCalledTimes(1);
});

it("refreshes the existing manual view only when another action confirms", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue(launch(false));
  const refresh = jest.fn();
  const { client } = renderUI(
    <DropForgeAutomationStatus claimId={123} onConfirmedWork={refresh} />
  );
  await screen.findByRole("heading", { name: "Automatic launch progress" });
  expect(refresh).not.toHaveBeenCalled();
  await act(async () => {
    client.setQueryData(forgeLaunchKey("0xcreator", 123), launch(true));
  });
  await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  await act(async () => {
    client.setQueryData(forgeLaunchKey("0xcreator", 123), {
      ...launch(true),
      revision: 2,
    });
  });
  expect(refresh).toHaveBeenCalledTimes(1);
});

it("allows a newer publication to replace a blocked unsigned metadata request", async () => {
  jest
    .mocked(getForgeLaunch)
    .mockResolvedValue({
      ...launch(true, "old"),
      state: "BLOCKED",
      error: "A newer Craft publication exists; request its metadata update",
      actions: [
        ...launch(true).actions,
        {
          id: "metadata-old",
          kind: "METADATA",
          state: "PENDING",
          phase: 0,
          due: 1,
          deadline: 100,
          recipients: 0,
        },
      ],
    } as ApiDropForgeLaunch);
  jest.mocked(requestForgeLaunch).mockResolvedValue(launch(true, "latest"));
  renderUI(
    <CraftLaunchActions claimId={123} metadata="latest" dirty={false} />
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Update Claim" })).toBeEnabled()
  );
  fireEvent.click(screen.getByRole("button", { name: "Update Claim" }));
  await waitFor(() =>
    expect(requestForgeLaunch).toHaveBeenCalledWith("0xcreator", 123, true)
  );
});
