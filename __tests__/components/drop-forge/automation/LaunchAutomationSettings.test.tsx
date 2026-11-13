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
  preparation_enabled: false,
  max_artist_payment_eth: null,
  updated_by: null,
  updated_at: 0,
  can_edit: true,
  can_edit_preparation: true,
  can_top_up: true,
  chain_id: 1,
  contract: "0x" + "22".repeat(20),
  signer_address: "0x" + "33".repeat(20),
  ens_name: "drops6529.eth",
  balance_wei: "1000000000000000000",
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
it("shows all switches Off, ENS, the exact address, explorer and balance", async () => {
  show();
  await screen.findByText("drops6529.eth");
  expect(
    screen.getByRole("switch", { name: /Automatic launch/ })
  ).not.toBeChecked();
  expect(
    screen.getByRole("switch", { name: /Automatic artist payment/ })
  ).not.toBeChecked();
  expect(
    screen.getByRole("switch", { name: /EMMA preparation/ })
  ).not.toBeChecked();
  expect(
    screen.getByRole("link", { name: settings.signer_address })
  ).toHaveAttribute(
    "href",
    `https://etherscan.io/address/${settings.signer_address}`
  );
  expect(screen.getByRole("button", { name: "Top Up ETH" })).toBeEnabled();
});
it("saves the existing revision and the changed switch, then displays the server result", async () => {
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
    })
  );
  await waitFor(() =>
    expect(
      screen.getByRole("switch", { name: /Automatic launch/ })
    ).toBeChecked()
  );
});
it("keeps all controls read-only for other authorized Drop Forge users", async () => {
  jest.mocked(getForgeSettings).mockResolvedValue({
    ...settings,
    can_edit: false,
    can_edit_preparation: false,
  });
  show();
  for (const control of await screen.findAllByRole("switch"))
    expect(control).toBeDisabled();
  expect(screen.getByRole("button", { name: "Top Up ETH" })).toBeEnabled();
});
it("lets a distribution administrator change EMMA preparation only", async () => {
  const limitedSettings = { ...settings, can_edit: false };
  jest.mocked(getForgeSettings).mockResolvedValue(limitedSettings);
  jest.mocked(saveForgeSettings).mockResolvedValue({
    ...limitedSettings,
    revision: 1,
    preparation_enabled: true,
  });
  show();
  const preparation = await screen.findByRole("switch", {
    name: /EMMA preparation/,
  });
  expect(preparation).toBeEnabled();
  expect(
    screen.getByRole("switch", { name: /Automatic launch/ })
  ).toBeDisabled();
  expect(
    screen.getByRole("switch", { name: /Automatic artist payment/ })
  ).toBeDisabled();
  expect(
    screen.getByRole("textbox", { name: "Maximum ETH per payout" })
  ).toBeDisabled();
  fireEvent.click(preparation);
  await waitFor(() =>
    expect(saveForgeSettings).toHaveBeenCalledWith({
      revision: 0,
      preparation_enabled: true,
    })
  );
});

it("enables the artist payment switch after saving a positive ETH cap", async () => {
  jest.mocked(saveForgeSettings).mockResolvedValue({
    ...settings,
    revision: 1,
    max_artist_payment_eth: "0.25",
  });
  show();
  const artist = await screen.findByRole("switch", {
    name: /Automatic artist payment/,
  });
  expect(artist).toBeDisabled();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Maximum ETH per payout" }),
    {
      target: { value: "0.25" },
    }
  );
  fireEvent.click(screen.getByRole("button", { name: "Save limit" }));
  await waitFor(() => expect(artist).toBeEnabled());
  expect(saveForgeSettings).toHaveBeenCalledWith({
    revision: 0,
    max_artist_payment_eth: "0.25",
  });
});
