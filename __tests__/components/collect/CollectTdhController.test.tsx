import CollectTdhController from "@/components/collect/CollectTdhController";
import type CollectGoalForm from "@/components/collect/CollectGoalForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";

const mockCompare = jest.fn();
let mockBudget = "1.25";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/services/api/collect-api", () => ({
  compareCollectTdh: (...args: unknown[]) => mockCompare(...args),
}));
jest.mock("@/components/collect/CollectRecipientPicker", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectGoalForm", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectGoalForm>) => (
    <>
      <button
        onClick={() =>
          props.onSubmit({ ...props.draft, budgetEth: mockBudget })
        }
      >
        Compare TDH
      </button>
      {props.error && <p role="alert">{props.error}</p>}
    </>
  ),
}));
const recipient = "0x1111111111111111111111111111111111111111";
function mount() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CollectTdhController
        collection="memes"
        profile={{ id: "profile", primary_wallet: recipient } as ApiIdentity}
        onConnect={jest.fn()}
      />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockBudget = "1.25";
  mockCompare.mockResolvedValue({
    account: { profile_id: "profile" },
    ranked: [],
    excluded: [],
    assumptions: [],
    evaluated_count: 0,
    horizon_days: 30,
  });
});
it.each(["", "not-a-number", "1e3", "0", "-1", "1.0000000000000000001"])(
  "rejects invalid TDH budget %s before parsing or requesting a comparison",
  (budgetEth) => {
    mockBudget = budgetEth;
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Compare TDH" }));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(mockCompare).not.toHaveBeenCalled();
  }
);
it("requests a valid profile comparison with its separate destination", async () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "Compare TDH" }));
  await waitFor(() =>
    expect(mockCompare).toHaveBeenCalledWith({
      profile_id: "profile",
      family: "memes",
      recipient,
      horizon_days: 30,
    })
  );
});
