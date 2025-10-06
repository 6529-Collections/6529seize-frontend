const mockFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: any[]) => mockFetch(...args),
  commonApiPost: jest.fn(),
}));

import {
  download,
  isSubscriptionsAdmin,
  SubscriptionConfirm,
} from "@/components/distribution-plan-tool/review-distribution-plan/table/ReviewDistributionPlanTableSubscription";
import { ApiIdentity } from "@/generated/models/ApiIdentity";

jest.mock("react-bootstrap", () => ({
  __esModule: true,
  Modal: Object.assign(
    ({ show, children }: any) => (show ? <div>{children}</div> : null),
    {
      Header: ({ children }: any) => <div>{children}</div>,
      Title: ({ children }: any) => <div>{children}</div>,
      Body: ({ children }: any) => <div>{children}</div>,
      Footer: ({ children }: any) => <div>{children}</div>,
    }
  ),
  Button: (p: any) => <button {...p}>{p.children}</button>,
  Col: (p: any) => <div>{p.children}</div>,
  Container: (p: any) => <div>{p.children}</div>,
  Row: (p: any) => <div>{p.children}</div>,
}));

describe("ReviewDistributionPlanTableSubscription utilities", () => {
  it("checks subscriptions admin wallets", () => {
    const profile: Partial<ApiIdentity> = { wallets: [{ wallet: "0xabc" }] };
    expect(isSubscriptionsAdmin(profile as ApiIdentity)).toBe(false);
  });

  it("downloads subscription results", async () => {
    mockFetch.mockResolvedValue({
      airdrops: [],
      airdrops_unconsolidated: [],
      allowlists: [],
    });
    await download("c", "1", "plan", "phase", "public");
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "subscriptions/allowlists/c/1/plan/phase",
    });
  });
  it("returns true when wallet is admin", () => {
    const profile: Partial<ApiIdentity> = {
      wallets: [{ wallet: "0x0187C9a182736ba18b44eE8134eE438374cf87DC" }],
    };
    expect(isSubscriptionsAdmin(profile as ApiIdentity)).toBe(true);
  });

  it("handles download failure", async () => {
    mockFetch.mockRejectedValue("fail");
    const result = await download("c", "1", "plan", "phase", "public");
    expect(result.success).toBe(false);
  });
});

import { render, screen } from "@testing-library/react";

test("SubscriptionConfirm extracts token id from plan name", () => {
  render(
    <SubscriptionConfirm
      title="t"
      plan={{ id: "1", name: "Meme 123 drop" } as any}
      show={true}
      handleClose={jest.fn()}
      onConfirm={jest.fn()}
    />
  );
  const input = screen.getByRole("spinbutton") as HTMLInputElement;
  expect(input.value).toBe("123");
});
