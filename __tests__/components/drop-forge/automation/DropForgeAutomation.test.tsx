import {
  ApiDropForgeActionKindEnum as ActionKind,
  ApiDropForgeActionStateEnum as ActionState,
} from "@/generated/models/ApiDropForgeAction";
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
import {
  ApiDropForgeJobKindEnum as JobKind,
  ApiDropForgeJobStatusEnum as JobStatus,
  type ApiDropForgeJob,
} from "@/generated/models/ApiDropForgeJob";
jest.mock("@/services/api/drop-forge-api", () => ({
  getForgeLaunch: jest.fn(),
  requestForgeLaunch: jest.fn(),
  latestForgeProcess: jest.fn(),
  startForgeProcess: jest.fn(),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: mockRequestAuth }),
}));
const mockRequestAuth = jest.fn().mockResolvedValue({ success: true });
jest.mock("@/components/drop-forge/drop-forge-config", () => ({
  useDropForgeMintingConfig: () => ({ contract: "0xcreator" }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
const clients: QueryClient[] = [];
afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
});
function renderUI(element: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
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
beforeEach(() => {
  jest.clearAllMocks();
  mockRequestAuth.mockResolvedValue({ success: true });
});
it.each([
  [1, "https://etherscan.io"],
  [11155111, "https://sepolia.etherscan.io"],
  [137, null],
])(
  "uses only the explicitly supported explorer for chain %i",
  async (chain, explorer) => {
    const current = launch(true);
    current.chain_id = chain as number;
    const action = current.actions[0];
    if (!action) throw new Error("Launch fixture must contain initialization");
    action.hash = "0x" + "a".repeat(64);
    jest.mocked(getForgeLaunch).mockResolvedValue(current);
    renderUI(
      <DropForgeAutomationStatus
        claimId={123}
        onConfirmedWork={() => undefined}
      />
    );
    await screen.findByText("Initialized");
    if (explorer)
      expect(
        screen.getByRole("link", { name: "View transaction" })
      ).toHaveAttribute("href", `${explorer}/tx/${action.hash}`);
    else
      expect(
        screen.queryByRole("link", { name: "View transaction" })
      ).not.toBeInTheDocument();
  }
);
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
    phase_ids: ["p0", "p1", "p2"],
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
  const { client, rerender } = renderUI(
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
  const nextCallback = jest.fn();
  rerender(
    <QueryClientProvider client={client}>
      <DropForgeAutomationStatus claimId={123} onConfirmedWork={nextCallback} />
    </QueryClientProvider>
  );
  expect(nextCallback).not.toHaveBeenCalled();
});

it("allows a newer publication to replace a blocked unsigned metadata request", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue({
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

it.each([
  [JobStatus.Completed, undefined],
  [JobStatus.Completed, ["old0", "old1", "old2"]],
  [JobStatus.AwaitingAuth, ["old0", "old1", "old2"]],
])(
  "requires reset for a %s job with stale phase evidence %j",
  async (status, phaseIds) => {
    jest.mocked(latestForgeProcess).mockResolvedValue({
      id: "job",
      status,
      phase_ids: phaseIds,
      kind: "PROCESS_ALL",
      step: 5,
    } as ApiDropForgeJob);
    renderUI(
      <ProcessAndFinalize
        contract="creator"
        claim={123}
        plan="plan"
        phaseIds={["p0", "p1", "p2"]}
      />
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Inputs changed. Reset the distribution before processing again."
      )
    );
    const button = screen.getByRole("button", {
      name:
        status === JobStatus.AwaitingAuth
          ? "Sign in to resume"
          : "Process and Finalize",
    });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mockRequestAuth).not.toHaveBeenCalled();
    expect(startForgeProcess).not.toHaveBeenCalled();
  }
);

it("allows processing changed phases after an explicit reset invalidates the prior job", async () => {
  jest.mocked(latestForgeProcess).mockResolvedValue({
    id: "old-job",
    status: JobStatus.Failed,
    phase_ids: ["old0", "old1", "old2"],
    kind: JobKind.ProcessAll,
    step: 5,
    error: "Distribution reset; process again",
  } as ApiDropForgeJob);
  jest.mocked(startForgeProcess).mockResolvedValue({
    id: "new-job",
    status: JobStatus.Pending,
    phase_ids: ["p0", "p1", "p2"],
    kind: JobKind.ProcessAll,
    step: 0,
  } as ApiDropForgeJob);
  renderUI(
    <ProcessAndFinalize
      contract="creator"
      claim={123}
      plan="plan"
      phaseIds={["p0", "p1", "p2"]}
    />
  );
  const button = await screen.findByRole("button", {
    name: "Process and Finalize",
  });
  await waitFor(() => expect(button).toBeEnabled());
  expect(
    screen.queryByText(
      "Inputs changed. Reset the distribution before processing again."
    )
  ).not.toBeInTheDocument();
  fireEvent.click(button);
  await waitFor(() =>
    expect(startForgeProcess).toHaveBeenCalledWith(
      "creator",
      123,
      "plan",
      ["p0", "p1", "p2"],
      expect.any(String)
    )
  );
  expect(jest.mocked(startForgeProcess).mock.calls[0]?.[4]).not.toBe("old-job");
});

it("queues processing with a UUID even when the browser lacks randomUUID", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis.crypto,
    "randomUUID"
  );
  Object.defineProperty(globalThis.crypto, "randomUUID", {
    configurable: true,
    value: undefined,
  });
  try {
    jest.mocked(latestForgeProcess).mockResolvedValue(null);
    jest.mocked(startForgeProcess).mockResolvedValue({
      id: "job",
      contract: "creator",
      claim_id: 123,
      kind: "PROCESS_ALL",
      status: "PENDING",
      step: 0,
      updated_at: 1,
    } as ApiDropForgeJob);
    renderUI(
      <ProcessAndFinalize
        contract="creator"
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
    fireEvent.click(
      screen.getByRole("button", { name: "Process and Finalize" })
    );
    await waitFor(() =>
      expect(startForgeProcess).toHaveBeenCalledWith(
        "creator",
        123,
        "plan",
        ["p0", "p1", "p2"],
        expect.stringMatching(
          /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i
        )
      )
    );
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis.crypto, "randomUUID", descriptor);
    else Reflect.deleteProperty(globalThis.crypto, "randomUUID");
  }
});
it("reauthenticates and resumes the existing job after refresh without generating another operation", async () => {
  const waiting: ApiDropForgeJob = {
    id: "11111111-1111-4111-8111-111111111111",
    contract: "creator",
    claim_id: 123,
    kind: JobKind.ProcessAll,
    phase_ids: ["p0", "p1", "p2"],
    status: JobStatus.AwaitingAuth,
    step: 0,
    updated_at: 1,
  };
  jest.mocked(latestForgeProcess).mockResolvedValue(waiting);
  jest
    .mocked(startForgeProcess)
    .mockResolvedValue({ ...waiting, status: JobStatus.Pending });
  renderUI(
    <ProcessAndFinalize
      contract="creator"
      claim={123}
      plan="plan"
      phaseIds={["p0", "p1", "p2"]}
    />
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Sign in to resume" })
  );
  await waitFor(() =>
    expect(startForgeProcess).toHaveBeenCalledWith(
      "creator",
      123,
      "plan",
      ["p0", "p1", "p2"],
      waiting.id
    )
  );
  expect(mockRequestAuth).toHaveBeenCalledWith({ serverRejected: true });
  expect(
    await screen.findByRole("button", { name: "Processing and finalizing…" })
  ).toBeDisabled();
});
it("leaves the waiting job intact when the operator cancels authentication", async () => {
  jest.mocked(latestForgeProcess).mockResolvedValue({
    id: "job",
    contract: "creator",
    claim_id: 123,
    kind: JobKind.ProcessAll,
    phase_ids: ["p0", "p1", "p2"],
    status: JobStatus.AwaitingAuth,
    step: 0,
    updated_at: 1,
  });
  mockRequestAuth.mockResolvedValue({ success: false });
  renderUI(
    <ProcessAndFinalize
      contract="creator"
      claim={123}
      plan="plan"
      phaseIds={["p0", "p1", "p2"]}
    />
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Sign in to resume" })
  );
  await waitFor(() => expect(mockRequestAuth).toHaveBeenCalled());
  expect(startForgeProcess).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Sign in to resume" })
  ).toBeEnabled();
});

it("groups phase actions and shows independent errors, skips and later pending work", async () => {
  const current = launch(true);
  const initialized = current.actions[0];
  if (!initialized) throw new Error("Initialization fixture missing");
  initialized.group = "phase-0";
  initialized.observed = true;
  current.phases = [
    { name: "Phase 0", start: 10, end: 20, root: "root", price_wei: "0" },
    { name: "Phase 1", start: 30, end: 40, root: "next", price_wei: "0" },
  ];
  current.actions.push(
    {
      ...initialized,
      id: "airdrop-0",
      label: "Phase 0 subscriber airdrops",
      kind: ActionKind.Airdrop,
      state: ActionState.Pending,
      observed: false,
      attempt_error: "Insufficient gas funds",
      attempt_count: 1,
    },
    {
      ...initialized,
      id: "phase-1",
      kind: ActionKind.Update,
      state: ActionState.Pending,
      group: "phase-1",
      phase: 1,
      observed: false,
    }
  );
  jest.mocked(getForgeLaunch).mockResolvedValue(current);
  renderUI(
    <DropForgeAutomationStatus
      claimId={123}
      onConfirmedWork={() => undefined}
    />
  );
  expect(
    await screen.findByRole("region", {
      name: "Opening: initialization and Phase 0 airdrops",
    })
  ).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Phase 1" })).toBeInTheDocument();
  expect(
    screen.getByText("Skipped — already completed on-chain")
  ).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Insufficient gas funds");
  expect(screen.getByText("Pending")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Pause automatic execution" })
  ).toBeInTheDocument();
});
