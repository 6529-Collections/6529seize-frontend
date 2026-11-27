import React from "react";
import CreatePlan from "@/components/distribution-plan-tool/create-plan/CreatePlan";
import {
  DistributionPlanToolContext,
  DistributionPlanToolStep,
} from "@/components/distribution-plan-tool/DistributionPlanToolContext";
import { distributionPlanApiFetch } from "@/services/distribution-plan-api";
import { screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { renderWithQueryClient } from "../../../utils/reactQuery";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/services/distribution-plan-api");

jest.mock("@/components/distribution-plan-tool/common/StepHeader", () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));
jest.mock("@/components/allowlist-tool/common/AllowlistToolLoader", () => ({
  __esModule: true,
  AllowlistToolLoaderSize: { LARGE: "LARGE" },
  default: () => <div data-testid="loader" />,
}));

const mockedFetch = distributionPlanApiFetch as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;

describe("CreatePlan", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderWithContext(step = DistributionPlanToolStep.CREATE_PLAN) {
    const setState = jest.fn();
    const router = { push: jest.fn() };
    mockedUseRouter.mockReturnValue(router);
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <DistributionPlanToolContext.Provider value={{ setState, step } as any}>
        {children}
      </DistributionPlanToolContext.Provider>
    );
    return {
      setState,
      push: router.push,
      ...renderWithQueryClient(<CreatePlan id="1" />, { wrapper: Wrapper }),
    };
  }

  it("fetches allowlist and sets state on success", async () => {
    const data = { id: "1", name: "plan", description: "" };
    mockedFetch.mockResolvedValue({ success: true, data });
    const { setState } = renderWithContext();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    await waitFor(() =>
      expect(mockedFetch).toHaveBeenCalledWith("/allowlists/1")
    );
    await waitFor(() => expect(setState).toHaveBeenCalledWith(data));
  });

  it("does not show the initial spinner while the previous step exits", async () => {
    mockedFetch.mockResolvedValue({ success: true, data: { id: "1" } });
    const { setState } = renderWithContext(DistributionPlanToolStep.REVIEW);
    expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    await waitFor(() => expect(setState).toHaveBeenCalled());
  });

  it("redirects when fetch fails", async () => {
    mockedFetch.mockResolvedValue({ success: false, data: null });
    const { push } = renderWithContext();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/emma"));
  });
});
