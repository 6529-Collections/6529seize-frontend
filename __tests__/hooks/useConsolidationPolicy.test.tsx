import { renderHook } from "@testing-library/react";
import { useConsolidationPolicy } from "@/hooks/useConsolidationPolicy";

const mockSettings = {
  isLoaded: true,
  loadError: null as Error | null,
  seizeSettings: {
    consolidation: {
      max_wallets: 4,
      ungated_max_wallets: 3,
      four_wallet_activation_at: "2026-10-15T00:00:00Z",
      four_wallet_signing_opens_at: "2026-10-15T00:10:00Z",
    },
  },
  loadSeizeSettings: jest.fn(),
};
jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: () => mockSettings,
}));

beforeEach(() => {
  mockSettings.isLoaded = true;
  mockSettings.loadError = null;
});

test("uses the existing settings response without making another request", () => {
  const { result } = renderHook(useConsolidationPolicy);
  expect(result.current.limits).toEqual({
    maxWallets: 4,
    ungatedMaxWallets: 3,
  });
  expect(result.current.policy?.maxWallets).toBe(4);
  expect(result.current.reload).toBe(mockSettings.loadSeizeSettings);
  expect(mockSettings.loadSeizeSettings).not.toHaveBeenCalled();
});

test("retains loaded limits for legacy plans when a background refresh fails", () => {
  const { result, rerender } = renderHook(useConsolidationPolicy);
  mockSettings.loadError = new Error("unavailable");
  rerender();
  expect(result.current.limits).toEqual({
    maxWallets: 4,
    ungatedMaxWallets: 3,
  });
  expect(result.current.policy).toBeNull();
});

test("does not invent wallet limits before settings have loaded", () => {
  mockSettings.isLoaded = false;
  const { result } = renderHook(useConsolidationPolicy);
  expect(result.current.limits).toBeNull();
  expect(result.current.policy).toBeNull();
});
