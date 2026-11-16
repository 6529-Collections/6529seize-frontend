import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LaunchAutomationSettings from "@/components/drop-forge/automation/LaunchAutomationSettings";
import {
  getForgeSettings,
  saveForgeSettings,
} from "@/services/api/drop-forge-settings";
import { useWaveById } from "@/hooks/useWaveById";
import type { ApiDropForgeSettings } from "@/generated/models/ApiDropForgeSettings";
jest.mock("@/hooks/useWaveById");
jest.mock("@/services/api/drop-forge-settings", () => ({
  getForgeSettings: jest.fn(),
  saveForgeSettings: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0x" + "11".repeat(20) }),
}));
const mockSetToast = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    requestAuth: async () => ({ success: true }),
    setToast: mockSetToast,
  }),
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
function show(expand = true) {
  const view = render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <LaunchAutomationSettings />
    </QueryClientProvider>
  );
  if (expand) {
    fireEvent.click(screen.getByRole("button", { name: "Launch Automation" }));
  }
  return view;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getForgeSettings).mockResolvedValue(settings);
  jest.mocked(useWaveById).mockReturnValue({
    wave: undefined,
  } as ReturnType<typeof useWaveById>);
});

it("opens and closes help without expanding the settings", async () => {
  show(false);
  const title = "How Launch Automation works";
  fireEvent.click(screen.getByRole("button", { name: title }));

  const dialog = await screen.findByRole("dialog", { name: title });
  expect(
    within(dialog).getByText(/Off pauses new automated actions/)
  ).toBeVisible();
  expect(
    within(dialog).getByText(
      /Distributions already using manual preparation keep their controls/
    )
  ).toBeVisible();
  fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Launch Automation" })
  ).toHaveAttribute("aria-expanded", "false");
});

it("starts collapsed, then shows the settings and operational wallet", async () => {
  show(false);
  const disclosure = screen.getByRole("button", { name: "Launch Automation" });
  expect(disclosure).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  fireEvent.click(disclosure);
  await screen.findByText("drops6529.eth");
  expect(
    screen.getByRole("switch", { name: /Automatic launch/ })
  ).not.toBeChecked();
  const payment = screen.getByRole("region", {
    name: "Automatic artist payment",
  });
  expect(within(payment).getByRole("status")).toHaveTextContent("Disabled");
  expect(within(payment).getByRole("status")).toHaveClass("tw-text-rose-300");
  expect(within(payment).getByText("0 ETH")).toBeVisible();
  expect(
    screen.getByRole("switch", { name: /EMMA preparation/ })
  ).not.toBeChecked();
  expect(
    screen.getByRole("link", { name: settings.signer_address })
  ).toHaveAttribute(
    "href",
    `https://etherscan.io/address/${settings.signer_address}`
  );
  expect(
    screen.queryByRole("link", { name: "Drop Forge Ops" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Top Up ETH" })).toBeEnabled();
});
it("links to the configured wave before the info button and shows the wave name on hover", async () => {
  const waveId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  const waveName = "Configured Drop Forge Ops";
  jest.mocked(getForgeSettings).mockResolvedValue({
    ...settings,
    operations_wave_id: waveId,
  });
  jest.mocked(useWaveById).mockReturnValue({
    wave: { id: waveId, name: waveName },
  } as ReturnType<typeof useWaveById>);

  show(false);
  const link = await screen.findByRole("link", { name: waveName });
  expect(useWaveById).toHaveBeenCalledWith(waveId);
  expect(link).toHaveAttribute("href", `/waves/${waveId}`);
  const info = screen.getByRole("button", {
    name: "How Launch Automation works",
  });
  expect(link.compareDocumentPosition(info)).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING
  );
  fireEvent.mouseEnter(link);
  expect(await screen.findByRole("tooltip")).toHaveTextContent(waveName);
});

it("shows the info tooltip when the button receives keyboard focus", async () => {
  show(false);
  const title = "How Launch Automation works";
  fireEvent.focus(screen.getByRole("button", { name: title }));
  expect(await screen.findByRole("tooltip")).toHaveTextContent(title);
});
it("shows saving in the changed switch row and confirms the saved setting", async () => {
  let finishSave!: (saved: ApiDropForgeSettings) => void;
  jest.mocked(saveForgeSettings).mockReturnValue(
    new Promise((resolve) => {
      finishSave = resolve;
    })
  );
  show();
  const control = await screen.findByRole("switch", {
    name: /Automatic launch/,
  });
  const row = control.closest("label");
  if (!row) throw new Error("Expected the switch to have a label");

  fireEvent.click(control);
  expect(await within(row).findByText("Saving…")).toBeVisible();
  expect(control).toHaveAttribute("aria-busy", "true");
  expect(saveForgeSettings).toHaveBeenCalledWith({
    revision: 0,
    automation_enabled: true,
  });
  expect(mockSetToast).not.toHaveBeenCalled();

  await act(async () => {
    finishSave({ ...settings, revision: 1, automation_enabled: true });
  });
  expect(control).toBeChecked();
  expect(within(row).getByText("On")).toBeVisible();
  expect(mockSetToast).toHaveBeenCalledWith({
    type: "success",
    message: "Automatic launch enabled.",
  });
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
  expect(screen.getByRole("button", { name: "Set limit" })).toBeDisabled();
  expect(
    screen.queryByRole("textbox", { name: "Maximum ETH per payout" })
  ).not.toBeInTheDocument();
  fireEvent.click(preparation);
  await waitFor(() =>
    expect(saveForgeSettings).toHaveBeenCalledWith({
      revision: 0,
      preparation_enabled: true,
    })
  );
});

it("saves a positive limit and enables payments in one request", async () => {
  jest.mocked(saveForgeSettings).mockResolvedValue({
    ...settings,
    revision: 1,
    max_artist_payment_eth: "0.25",
    pay_artist_enabled: true,
  });
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Set limit" }));
  const input = screen.getByRole("textbox", { name: "Maximum ETH per payout" });
  const save = screen.getByRole("button", { name: "Save & Enable" });
  fireEvent.change(input, { target: { value: "hello" } });
  expect(input).toHaveValue("");
  fireEvent.change(input, { target: { value: "0" } });
  expect(save).toBeDisabled();
  fireEvent.change(input, { target: { value: ".25" } });
  fireEvent.click(save);
  expect(await screen.findByRole("button", { name: "Disable" })).toBeEnabled();
  expect(
    within(
      screen.getByRole("region", { name: "Automatic artist payment" })
    ).getByRole("status")
  ).toHaveClass("tw-text-emerald-300");
  expect(mockSetToast).toHaveBeenCalledWith({
    type: "success",
    message: "Artist payment limit saved and automatic payments enabled.",
  });
  expect(screen.getByText("0.25 ETH")).toBeVisible();
  expect(saveForgeSettings).toHaveBeenCalledTimes(1);
  expect(saveForgeSettings).toHaveBeenCalledWith({
    revision: 0,
    max_artist_payment_eth: "0.25",
    pay_artist_enabled: true,
  });
});

it("disables without clearing the saved cap, then re-enables with it", async () => {
  const enabled = {
    ...settings,
    max_artist_payment_eth: "0.5",
    pay_artist_enabled: true,
  };
  jest.mocked(getForgeSettings).mockResolvedValue(enabled);
  jest
    .mocked(saveForgeSettings)
    .mockResolvedValueOnce({
      ...enabled,
      revision: 1,
      pay_artist_enabled: false,
    })
    .mockResolvedValueOnce({ ...enabled, revision: 2 });
  show();
  fireEvent.click(await screen.findByRole("button", { name: "Disable" }));
  const reenable = await screen.findByRole("button", { name: "Enable" });
  expect(screen.getByText("Saved maximum ETH per payout")).toBeVisible();
  expect(screen.getByText("0.5 ETH")).toBeVisible();
  fireEvent.click(reenable);
  expect(await screen.findByRole("button", { name: "Disable" })).toBeEnabled();
  expect(saveForgeSettings).toHaveBeenNthCalledWith(1, {
    revision: 0,
    pay_artist_enabled: false,
  });
  expect(saveForgeSettings).toHaveBeenNthCalledWith(2, {
    revision: 1,
    pay_artist_enabled: true,
  });
});

it("confirms clipboard success and reports a clipboard rejection in the wallet panel", async () => {
  const previousClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    "clipboard"
  );
  const writeText = jest
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("Denied"));
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  try {
    show();
    const copy = await screen.findByRole("button", {
      name: "Copy wallet address",
    });
    fireEvent.click(copy);
    await waitFor(() =>
      expect(
        screen
          .getAllByRole("status")
          .find((status) => status.textContent === "Copied")
      ).toBeInTheDocument()
    );
    expect(writeText).toHaveBeenCalledWith(settings.signer_address);
    fireEvent.click(copy);
    await waitFor(() =>
      expect(
        screen
          .getAllByText("Couldn’t copy address.")
          .some((message) => !message.hasAttribute("aria-hidden"))
      ).toBe(true)
    );
    expect(screen.getByRole("button", { name: "Copy wallet address" })).toBe(
      copy
    );
  } finally {
    if (previousClipboard)
      Object.defineProperty(navigator, "clipboard", previousClipboard);
    else Reflect.deleteProperty(navigator, "clipboard");
  }
});
