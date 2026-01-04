import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BuildPhaseForm from "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseForm";
import type { BuildPhasesPhase } from "@/components/distribution-plan-tool/build-phases/BuildPhases";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "@/components/distribution-plan-tool/DistributionPlanToolContext";
// Mock sub components to keep test focused
jest.mock(
  "@/components/distribution-plan-tool/common/DistributionPlanAddOperationBtn",
  () =>
    ({ children }: any) =>
      (
        <button data-testid="submit-btn" type="submit">
          {children}
        </button>
      )
);

const modalMock = jest.fn();
jest.mock(
  "@/components/distribution-plan-tool/build-phases/build-phase/form/BuildPhaseFormConfigModal",
  () => ({
    __esModule: true,
    default: (props: any) => {
      modalMock(props);
      return <div data-testid="config-modal" />;
    },
  })
);

jest.mock(
  "@/components/allowlist-tool/common/modals/AllowlistToolCommonModalWrapper",
  () => ({
    __esModule: true,
    AllowlistToolModalSize: { X_LARGE: "X_LARGE" },
    default: ({ showModal, onClose, children }: any) =>
      showModal ? (
        <div data-testid="modal">
          <button data-testid="close" onClick={onClose}>
            close
          </button>
          {children}
        </div>
      ) : null,
  })
);

const phase: BuildPhasesPhase = {
  name: "Test Phase",
  description: "Test Description",
  buildSpec: [],
  allowlistSpec: [],
};

const defaultContext = {
  step: DistributionPlanToolStep.BUILD_PHASES,
  setStep: jest.fn(),
  fetching: false,
  runOperations: jest.fn(),
  operations: [] as any[],
  fetchOperations: jest.fn(),
  setState: jest.fn(),
  distributionPlan: {
    id: "allowlist",
    name: "",
    description: "",
    createdAt: 0,
  } as any,
  transferPools: [],
  setTransferPools: jest.fn(),
  tokenPools: [],
  setTokenPools: jest.fn(),
  customTokenPools: [],
  setCustomTokenPools: jest.fn(),
  phases: [] as any[],
  setPhases: jest.fn(),
  setToasts: jest.fn(),
};

const renderComponent = (ctx?: Partial<typeof defaultContext>) => {
  return render(
    <DistributionPlanToolContext.Provider value={{ ...defaultContext, ...ctx }}>
      <BuildPhaseForm selectedPhase={phase} phases={[phase]} />
    </DistributionPlanToolContext.Provider>
  );
};

describe("BuildPhaseForm", () => {
  it("updates form values and opens modal on submit", async () => {
    renderComponent();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Group" } });
    fireEvent.change(inputs[1], { target: { value: "Desc" } });

    fireEvent.click(screen.getByTestId("submit-btn"));

    expect(await screen.getByTestId("modal")).toBeInTheDocument();
    expect(modalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Group",
        description: "Desc",
        selectedPhase: phase,
        phases: [phase],
      })
    );
  });

  it("resets form and closes modal on close", () => {
    renderComponent();
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Group" } });
    fireEvent.change(inputs[1], { target: { value: "Desc" } });
    fireEvent.click(screen.getByTestId("submit-btn"));

    fireEvent.click(screen.getByTestId("close"));

    expect(screen.queryByTestId("modal")).toBeNull();
    const finalInputs = screen.getAllByRole("textbox");
    expect((finalInputs[0] as HTMLInputElement).value).toBe("");
    expect((finalInputs[1] as HTMLInputElement).value).toBe("");
  });
});
