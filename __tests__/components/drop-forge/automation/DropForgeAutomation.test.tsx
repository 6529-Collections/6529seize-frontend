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
import { getLaunchInlineStatuses } from "@/components/drop-forge/launch/DropForgeInlineStatus";
import CraftLaunchActions from "@/components/drop-forge/craft/CraftLaunchActions";
import ProcessAndFinalize from "@/components/distribution-plan-tool/review-distribution-plan/ProcessAndFinalize";
import {
  getForgeLaunch,
  requestForgeLaunch,
  latestForgeProcess,
  startForgeProcess,
} from "@/services/api/drop-forge-api";
import {
  ApiDropForgeLaunchStateEnum as LaunchState,
  type ApiDropForgeLaunch,
} from "@/generated/models/ApiDropForgeLaunch";
import { useDropForgeSettings } from "@/hooks/useDropForgeSettings";
import { forgeLaunchKey } from "@/hooks/drop-forge-query-keys";
import { forgeProcessKey } from "@/hooks/useDropForgeProcess";
import { resolveForgePhaseInputs } from "@/services/api/drop-forge-process-inputs";
import { commonApiPost } from "@/services/api/common-api";
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
jest.mock("@/hooks/useDropForgeSettings");
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
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
  jest.mocked(useDropForgeSettings).mockReturnValue({
    data: { automation_enabled: true },
  } as ReturnType<typeof useDropForgeSettings>);
});
it("shows inline prerequisites only for a saved plan and confirms manual artist delivery independently", () => {
  expect(getLaunchInlineStatuses(undefined, "phase0")).toBeUndefined();
  const current = launch(false);
  expect(
    getLaunchInlineStatuses({ ...current, state: LaunchState.Draft }, "phase0")
  ).toBeUndefined();
  current.phases = [
    { name: "Phase 0", start: 10, end: 20, root: "0x0", price_wei: "0" },
  ];
  const initialization = current.actions[0];
  if (!initialization) throw new Error("Initialization fixture missing");
  const artist = {
    ...initialization,
    id: "artist",
    kind: ActionKind.Airdrop,
    label: "Airdrop - Artist",
    recipients: 1,
  };
  current.actions.push(artist, {
    ...artist,
    id: "team",
    label: "Airdrop - Team",
  });
  expect(getLaunchInlineStatuses(current, "phase0")?.artist?.key).toBe(
    "waitingInit"
  );
  initialization.state = ActionState.Confirmed;
  artist.state = ActionState.Confirmed;
  artist.observed = true;
  const verified = getLaunchInlineStatuses(current, "phase0");
  expect(verified?.artist?.key).toBe("completedManually");
  expect(verified?.team).toBeUndefined();
});
it("only offers Retry now when the server allows it and submits the current revision", async () => {
  const current = launch(false);
  const action = current.actions[0]!;
  action.wallet_blocked = true;
  action.wallet_retry_available = false;
  jest.mocked(getForgeLaunch).mockResolvedValue(current);
  jest.mocked(commonApiPost).mockResolvedValue(current);
  const { client } = renderUI(
    <DropForgeAutomationStatus
      claimId={123}
      onConfirmedWork={() => undefined}
    />
  );
  await screen.findByText("No automatic retry scheduled.");
  expect(screen.queryByRole("button", { name: "Retry now" })).toBeNull();
  act(() => {
    client.setQueryData(forgeLaunchKey("0xcreator", 123), {
      ...current,
      actions: [{ ...action, wallet_retry_available: true }],
    });
  });
  fireEvent.click(await screen.findByRole("button", { name: "Retry now" }));
  await waitFor(() =>
    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: "drop-forge/launches/0xcreator/123/control",
      body: { revision: current.revision, operation: "RETRY" },
    })
  );
  expect(mockRequestAuth).toHaveBeenCalledTimes(1);
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
it("disables Launch and explains that Automatic launch is off", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue(null);
  jest.mocked(useDropForgeSettings).mockReturnValue({
    data: { automation_enabled: false },
  } as ReturnType<typeof useDropForgeSettings>);
  renderUI(
    <CraftLaunchActions claimId={123} metadata="published" dirty={false} />
  );
  await screen.findByText("Automatic launch is off.");
  const launchButton = screen.getByRole("button", { name: "Launch" });
  expect(launchButton).toBeDisabled();
  fireEvent.click(launchButton);
  expect(requestForgeLaunch).not.toHaveBeenCalled();
});
it("shows the Auto Launch pill and initialized state with current metadata", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue(launch(true));
  renderUI(
    <CraftLaunchActions claimId={123} metadata="published" dirty={false} />
  );
  await screen.findByText("Claim initialized");
  expect(screen.getByText("Auto Launch")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Update Claim" })
  ).not.toBeInTheDocument();
});
it("prevents launch for unpublished or unsaved changes", async () => {
  jest.mocked(getForgeLaunch).mockResolvedValue(null);
  renderUI(<CraftLaunchActions claimId={123} metadata={null} dirty />);
  await screen.findByText("Save and publish Craft changes before continuing.");
  expect(screen.getByRole("button", { name: "Launch" })).toBeDisabled();
  expect(requestForgeLaunch).not.toHaveBeenCalled();
});
it.each<[number, string]>([
  [123, ""],
  [123, "   "],
  [Number.NaN, "plan"],
  [0, "plan"],
  [1.5, "plan"],
])("blocks processing for claim %s and plan %j", (claim, plan) => {
  renderUI(
    <ProcessAndFinalize
      contract="0xcreator"
      claim={claim}
      plan={plan}
      phaseIds={["p0", "p1", "p2"]}
    />
  );

  const button = screen.getByRole("button", { name: "Process and Finalize" });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(latestForgeProcess).not.toHaveBeenCalled();
  expect(mockRequestAuth).not.toHaveBeenCalled();
  expect(startForgeProcess).not.toHaveBeenCalled();
});

it.each(["Phase 1", "phase1", "P 1", "p1", " 1 "])(
  "accepts the phase alias %s and keeps numeric phase order",
  (name) => {
    expect(
      resolveForgePhaseInputs([
        { id: "third", name: "P2" },
        { id: "second", name },
        { id: "first", name: "0" },
        { id: "public", name: "Public" },
      ])
    ).toEqual({
      phaseIds: ["first", "second", "third"],
      missing: [],
      duplicates: [],
    });
  }
);

it("explains missing and duplicate phases without submitting a job", async () => {
  jest.mocked(latestForgeProcess).mockResolvedValue(null);
  const phases = resolveForgePhaseInputs([
    { id: "second", name: "P1" },
    { id: "duplicate", name: "1" },
    { id: "unrelated", name: "Phase 20" },
    { id: "first", name: "0" },
  ]);
  renderUI(
    <ProcessAndFinalize
      contract="0xcreator"
      claim={123}
      plan="plan"
      phaseIds={phases.phaseIds}
      phaseIssues={phases}
    />
  );

  const button = screen.getByRole("button", { name: "Process and Finalize" });
  expect(button).toBeDisabled();
  expect(button).toHaveAccessibleDescription(
    "Missing from this plan: Phase 2. Multiple phases match Phase 1. Rename the duplicates in EMMA."
  );
  fireEvent.click(button);
  expect(startForgeProcess).not.toHaveBeenCalled();
});

it("shows the saved checkpoint while a background job is pending", async () => {
  jest.mocked(latestForgeProcess).mockResolvedValue({
    id: "job",
    contract: "0xcreator",
    claim_id: 123,
    kind: JobKind.ProcessAll,
    status: JobStatus.Pending,
    step: 2,
    updated_at: 1,
  } as ApiDropForgeJob);
  renderUI(
    <ProcessAndFinalize
      contract="0xcreator"
      claim={123}
      plan="plan"
      phaseIds={["p0", "p1", "p2"]}
    />
  );
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Processing and finalizing… · Step 3 of 5"
    )
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(startForgeProcess).not.toHaveBeenCalled();
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
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Processing and finalizing… · Step 1 of 5"
    )
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
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
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Completed · Lists ready to download"
    )
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  expect(startForgeProcess).toHaveBeenCalledTimes(1);
});

it("uses a fresh request ID when processing again after a reset", async () => {
  jest.mocked(latestForgeProcess).mockResolvedValue(null);
  jest
    .mocked(startForgeProcess)
    .mockImplementation(async (_contract, _claim, _plan, phaseIds, id) => ({
      id,
      contract: "0xcreator",
      claim_id: 123,
      kind: JobKind.ProcessAll,
      status: JobStatus.Pending,
      phase_ids: phaseIds,
      step: 0,
      result_json: null,
      error: null,
      updated_at: 1,
    }));
  const { client } = renderUI(
    <ProcessAndFinalize
      contract="0xcreator"
      claim={123}
      plan="plan"
      phaseIds={["p0", "p1", "p2"]}
    />
  );
  const readyButton = () =>
    screen.getByRole("button", { name: "Process and Finalize" });
  await waitFor(() => expect(readyButton()).toBeEnabled());
  fireEvent.click(readyButton());
  expect(await screen.findByText("Processing and finalizing…")).toBeVisible();
  await waitFor(() => expect(startForgeProcess).toHaveBeenCalledTimes(1));

  await act(async () => {
    await client.refetchQueries({
      queryKey: forgeProcessKey("0xcreator", 123, "plan"),
    });
  });
  await waitFor(() => expect(readyButton()).toBeEnabled());
  fireEvent.click(readyButton());
  await waitFor(() => expect(startForgeProcess).toHaveBeenCalledTimes(2));
  const [firstCall, secondCall] = jest.mocked(startForgeProcess).mock.calls;
  expect(secondCall?.[4]).not.toBe(firstCall?.[4]);
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
        /^Inputs changed\. Reset the distribution before processing again\.$/
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

it("shows progress while a job with changed phase inputs is still running", async () => {
  jest.mocked(latestForgeProcess).mockResolvedValue({
    id: "job",
    status: JobStatus.Pending,
    phase_ids: ["old0", "old1", "old2"],
    kind: JobKind.ProcessAll,
    step: 1,
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
      "Processing and finalizing… · Step 2 of 5"
    )
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

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
  expect(await screen.findByText("Processing and finalizing…")).toBeVisible();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
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
