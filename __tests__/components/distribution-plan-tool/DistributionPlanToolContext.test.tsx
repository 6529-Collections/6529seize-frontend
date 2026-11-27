import React from "react";
import { render, screen, act } from "@testing-library/react";
import DistributionPlanToolContextWrapper, {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import {
  AllowlistOperationCode,
  DistributionPlanTokenPoolDownloadStatus,
} from "@/components/allowlist-tool/allowlist-tool.types";
import {
  getRequestedEmmaPlanStep,
  restoreEmmaPlanStep,
} from "@/components/distribution-plan-tool/emma-plan-step";
import { getEmmaReturnPath } from "@/components/distribution-plan-tool/emma-route";

jest.mock("@/services/distribution-plan-api", () => ({
  distributionPlanApiFetch: jest.fn(),
  distributionPlanApiPost: jest.fn(),
}));

import {
  distributionPlanApiFetch,
  distributionPlanApiPost,
} from "@/services/distribution-plan-api";

jest.mock("react-use", () => ({
  useInterval: jest.fn(),
}));
import type { TypeOptions } from "react-toastify";

const mockShowAppToast = jest.fn();
const mockShowAppToasts = jest.fn(
  ({
    messages,
    type,
  }: {
    readonly messages: readonly string[];
    readonly type: TypeOptions;
  }) => {
    messages.forEach((message) => mockShowAppToast({ message, type }));
  }
);

jest.mock("@/components/utils/toast/AppToast", () => ({
  showAppToast: (toast: unknown) => mockShowAppToast(toast),
  showAppToasts: (input: {
    readonly messages: readonly string[];
    readonly type: TypeOptions;
  }) => mockShowAppToasts(input),
}));

const plan = { id: "1", name: "Plan", description: "desc", createdAt: 0 };
const transferPools = [
  {
    id: "tp1",
    allowlistId: "1",
    name: "tp",
    description: "",
    contract: "",
    blockNo: 0,
    transfersCount: 0,
  },
];
const tokenPools = [
  {
    id: "tok1",
    allowlistId: "1",
    name: "tok",
    description: "",
    walletsCount: 0,
    tokensCount: 0,
  },
];
const customPools = [
  {
    id: "c1",
    allowlistId: "1",
    name: "c",
    description: "",
    walletsCount: 0,
    tokensCount: 0,
  },
];
const operations = [
  {
    id: "op1",
    createdAt: 0,
    order: 0,
    allowlistId: "1",
    hasRan: false,
    code: "CREATE" as any,
    params: {},
  },
];
const phases = [
  {
    id: "ph1",
    allowlistId: "1",
    name: "p",
    description: "",
    insertionOrder: 0,
    walletsCount: 0,
    tokensCount: 0,
    winnersWalletsCount: 0,
    winnersSpotsCount: 0,
    components: [],
  },
];

test("restores the requested step from saved progress and clamps premature Review links", () => {
  const review = getRequestedEmmaPlanStep("?step=review");
  const build = getRequestedEmmaPlanStep("?step=build-phases");
  expect(restoreEmmaPlanStep(review, [], phases, [])).toBe(
    DistributionPlanToolStep.REVIEW
  );
  expect(restoreEmmaPlanStep(build, [], phases, [])).toBe(
    DistributionPlanToolStep.BUILD_PHASES
  );
  expect(restoreEmmaPlanStep(review, [], [], [])).toBe(
    DistributionPlanToolStep.CREATE_SNAPSHOTS
  );
  const snapshot = {
    ...operations[0]!,
    code: AllowlistOperationCode.CREATE_TOKEN_POOL,
    hasRan: true,
    params: { id: "tok1" },
  };
  const completed = DistributionPlanTokenPoolDownloadStatus.COMPLETED;
  const download = {
    contract: "",
    tokenPoolId: "tok1",
    allowlistId: plan.id,
    blockNo: 1,
    status: completed,
    rawStatus: completed,
    stale: false,
    retryable: false,
    attemptCount: 1,
    failureCount: 0,
  };
  expect(restoreEmmaPlanStep(review, [snapshot], [], [download])).toBe(
    DistributionPlanToolStep.CREATE_PHASES
  );
  expect(restoreEmmaPlanStep(review, [snapshot], phases, [download])).toBe(
    DistributionPlanToolStep.REVIEW
  );
  for (const incompleteDownloads of [
    null,
    [],
    [{ ...download, tokenPoolId: "another-pool" }],
    [{ ...download, status: DistributionPlanTokenPoolDownloadStatus.PENDING }],
    [{ ...download, status: DistributionPlanTokenPoolDownloadStatus.FAILED }],
  ]) {
    expect(
      restoreEmmaPlanStep(review, [snapshot], phases, incompleteDownloads)
    ).toBe(DistributionPlanToolStep.CREATE_SNAPSHOTS);
  }
  const operation = {
    ...operations[0]!,
    code: AllowlistOperationCode.MAP_RESULTS_TO_DELEGATED_WALLETS,
  };
  expect(restoreEmmaPlanStep(review, [operation], phases, [])).toBe(
    DistributionPlanToolStep.MAP_DELEGATIONS
  );
  expect(getEmmaReturnPath("/emma/plans/1?step=review")).toBe(
    "/emma/plans/1?step=review"
  );
  expect(
    getEmmaReturnPath("/emma/plans/1?step=review&next=https://example.com")
  ).toBe("/emma/plans");
});

function ContextReader() {
  const context = React.useContext(DistributionPlanToolContext);
  return (
    <>
      <div data-testid="step">{context.step}</div>
      <button data-testid="run" onClick={context.runOperations} />
      <button data-testid="set-null" onClick={() => context.setState(null)} />
      <button data-testid="set-plan" onClick={() => context.setState(plan)} />
      <button
        data-testid="toast"
        onClick={() =>
          context.setToasts({
            messages: ["a", "b"],
            type: "info" as TypeOptions,
          })
        }
      />
      <button
        data-testid="error-toast"
        onClick={() =>
          context.setToasts({
            messages: ["error"],
            type: "error" as TypeOptions,
          })
        }
      />
      <button
        data-testid="structured-toast"
        onClick={() =>
          context.setToast({
            type: "success" as TypeOptions,
            title: "Saved.",
            description: "Your changes are ready.",
          })
        }
      />
    </>
  );
}

function setup() {
  return render(
    <DistributionPlanToolContextWrapper>
      <ContextReader />
    </DistributionPlanToolContextWrapper>
  );
}

describe("DistributionPlanToolContext", () => {
  beforeEach(() => {
    (distributionPlanApiFetch as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });
    (distributionPlanApiPost as jest.Mock).mockResolvedValue({
      success: true,
      data: plan,
    });
    mockShowAppToast.mockClear();
    mockShowAppToasts.mockClear();
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("writes a restored step back to the same plan's URL", async () => {
    window.history.replaceState(null, "", "/emma/plans/1?step=review");
    setup();

    await act(async () => {
      screen.getByTestId("set-plan").click();
    });

    expect(window.location.search).toBe("?step=create-snapshots");
  });

  it.each([
    {
      scenario: "after navigating to another plan",
      nextPath: "/emma/plans/2?step=review",
      unmount: false,
    },
    {
      scenario: "after unmounting",
      nextPath: "/emma/plans/1?step=review",
      unmount: true,
    },
  ])("ignores a late restore $scenario", async ({ nextPath, unmount }) => {
    window.history.replaceState(null, "", "/emma/plans/1?step=review");
    const pending = Promise.withResolvers<{ success: boolean; data: [] }>();
    jest.mocked(distributionPlanApiFetch).mockReturnValueOnce(pending.promise);
    const view = setup();

    await act(async () => {
      screen.getByTestId("set-plan").click();
    });
    if (unmount) view.unmount();
    window.history.replaceState(null, "", nextPath);
    await act(async () => {
      pending.resolve({ success: true, data: [] });
    });

    expect(window.location.pathname + window.location.search).toBe(nextPath);
  });

  it("renders children and default step", () => {
    setup();
    expect(screen.getByTestId("step").textContent).toBe(
      DistributionPlanToolStep.CREATE_PLAN
    );
  });

  it("resets state when setState is called with null", async () => {
    setup();
    await act(async () => {
      screen.getByTestId("set-plan").click();
    });
    expect(screen.getByTestId("step").textContent).toBe(
      DistributionPlanToolStep.CREATE_SNAPSHOTS
    );
    await act(async () => {
      screen.getByTestId("set-null").click();
    });
    expect(screen.getByTestId("step").textContent).toBe(
      DistributionPlanToolStep.CREATE_PLAN
    );
  });

  it("runs operations and updates state", async () => {
    setup();
    await act(async () => {
      screen.getByTestId("set-plan").click();
    });
    await act(async () => {
      screen.getByTestId("run").click();
    });
    expect(distributionPlanApiPost).toHaveBeenCalledWith({
      endpoint: `/allowlists/${plan.id}/runs`,
      body: { allowlistId: plan.id },
    });
    expect(screen.getByTestId("step").textContent).toBe(
      DistributionPlanToolStep.CREATE_SNAPSHOTS
    );
  });

  it("displays toasts for messages", () => {
    setup();
    screen.getByTestId("toast").click();
    expect(mockShowAppToasts).toHaveBeenCalledWith({
      messages: ["a", "b"],
      type: "info",
    });
    expect(mockShowAppToast).toHaveBeenCalledTimes(2);
    expect(mockShowAppToast).toHaveBeenCalledWith({
      message: "a",
      type: "info",
    });
  });

  it("displays error toasts for messages", () => {
    setup();
    screen.getByTestId("error-toast").click();
    expect(mockShowAppToasts).toHaveBeenCalledWith({
      messages: ["error"],
      type: "error",
    });
  });

  it("supports structured toasts", () => {
    setup();
    screen.getByTestId("structured-toast").click();
    expect(mockShowAppToast).toHaveBeenCalledWith({
      type: "success",
      title: "Saved.",
      description: "Your changes are ready.",
    });
  });
});
