import React from "react";
import { render, screen, act } from "@testing-library/react";
import DistributionPlanToolContextWrapper, {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "@/components/distribution-plan-tool/DistributionPlanToolContext";

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
