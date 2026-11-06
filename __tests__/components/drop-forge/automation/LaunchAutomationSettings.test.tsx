import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LaunchAutomationSettings from "@/components/drop-forge/automation/LaunchAutomationSettings";
import {
  getForgeSettings,
  saveForgeSettings,
} from "@/services/api/drop-forge-settings";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
jest.mock("@/services/api/drop-forge-settings", () => ({
  getForgeSettings: jest.fn(),
  saveForgeSettings: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x" + "11".repeat(20) }),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ requestAuth: async () => ({ success: true }) }),
}));
jest.mock("@/components/drop-forge/automation/WalletFunding", () => ({
  __esModule: true,
  default: () => <button>Top Up ETH</button>,
}));
const settings: ApiDropForgeSettings = {
  revision: 0,
  automation_enabled: false,
  pay_artist_enabled: false,
  updated_by: null,
  updated_at: 0,
  can_edit: true,
  can_top_up: true,
  chain_id: 1,
  contract: "0x" + "22".repeat(20),
  signer_address: "0x" + "33".repeat(20),
  ens_name: "drops6529.eth",
  balance_wei: "1000000000000000000",
  execution_available: true,
  artist_payment_available: true,
};
function show() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <LaunchAutomationSettings />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getForgeSettings).mockResolvedValue(settings);
});
it("shows both switches Off, ENS, the exact address, explorer and balance", async () => {
  show();
  await screen.findByText("drops6529.eth");
  expect(
    screen.getByRole("switch", { name: /Automatic launch/ })
  ).not.toBeChecked();
  expect(
    screen.getByRole("switch", { name: /Automatic artist payment/ })
  ).not.toBeChecked();
  expect(
    screen.getByRole("link", { name: settings.signer_address })
  ).toHaveAttribute(
    "href",
    `https://etherscan.io/address/${settings.signer_address}`
  );
  expect(screen.getByRole("button", { name: "Top Up ETH" })).toBeEnabled();
});
it("saves the existing revision and both booleans, then displays the server result", async () => {
  jest
    .mocked(saveForgeSettings)
    .mockResolvedValue({ ...settings, revision: 1, automation_enabled: true });
  show();
  fireEvent.click(
    await screen.findByRole("switch", { name: /Automatic launch/ })
  );
  await waitFor(() =>
    expect(saveForgeSettings).toHaveBeenCalledWith({
      revision: 0,
      automation_enabled: true,
      pay_artist_enabled: false,
    })
  );
  await waitFor(() =>
    expect(
      screen.getByRole("switch", { name: /Automatic launch/ })
    ).toBeChecked()
  );
});
it("keeps both controls read-only for other authorized Drop Forge users", async () => {
  jest
    .mocked(getForgeSettings)
    .mockResolvedValue({ ...settings, can_edit: false });
  show();
  for (const control of await screen.findAllByRole("switch"))
    expect(control).toBeDisabled();
  expect(screen.getByRole("button", { name: "Top Up ETH" })).toBeEnabled();
});
it("does not offer enablement when infrastructure or payment setup is missing", async () => {
  jest.mocked(getForgeSettings).mockResolvedValue({
    ...settings,
    execution_available: false,
    artist_payment_available: false,
  });
  show();
  for (const control of await screen.findAllByRole("switch"))
    expect(control).toBeDisabled();
});
