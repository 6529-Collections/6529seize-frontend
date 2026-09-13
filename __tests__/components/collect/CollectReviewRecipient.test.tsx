import CollectReviewRecipient from "@/components/collect/CollectReviewRecipient";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { getAddress, zeroAddress } from "viem";

const primary = "0x52908400098527886e0f7030069857d2e4169ee7";
const custody = "0xde709f2102306220921060314715629080e2fb77";
const fren = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
const profile = {
  id: "collector",
  primary_wallet: primary,
  wallets: [
    { wallet: primary, display: "collector.eth", tdh: 0 },
    { wallet: custody, display: "custody.collector.eth", tdh: 0 },
  ],
} as ApiIdentity;

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/server.helpers", () => ({ getUserProfile: jest.fn() }));
jest.mock("@/components/nft-transfer/TransferModalPfp", () => () => null);

type Props = ComponentProps<typeof CollectReviewRecipient>;
function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    address: primary,
    name: "collector.eth",
    profile,
    payingWallet: primary,
    recipientInProfile: true,
    disabled: false,
    onEditingChange: jest.fn(),
    onApply: jest.fn(async () => true),
    ...overrides,
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...render(<CollectReviewRecipient {...props} />, { wrapper }),
    props,
  };
}
const trigger = () =>
  screen.getByRole("button", { name: "Deliver to collector.eth" });
const applyButton = () =>
  screen.getByRole("button", { name: "Use this address" });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useIdentity).mockReturnValue({ profile: null, isLoading: false });
  jest.mocked(commonApiFetch).mockResolvedValue([]);
});

it("opens confirmed profile wallets immediately and applies only the explicit chosen checksum", async () => {
  const user = userEvent.setup();
  const { props } = setup();
  expect(trigger()).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("button", { name: /custody.collector.eth/ })
  ).not.toBeInTheDocument();
  await user.click(trigger());
  expect(props.onEditingChange).toHaveBeenLastCalledWith(true);
  expect(
    screen.getByText(getAddress(primary), { selector: "code" })
  ).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  expect(props.onApply).not.toHaveBeenCalled();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(commonApiFetch).not.toHaveBeenCalled();
  await user.click(applyButton());
  expect(props.onApply).toHaveBeenCalledWith(getAddress(custody), false);
  expect(props.onApply).toHaveBeenCalledTimes(1);
  expect(props.onEditingChange).toHaveBeenLastCalledWith(false);
  expect(trigger()).toHaveAttribute("aria-expanded", "false");
  expect(trigger()).toHaveFocus();
});

it("cancels an unsaved destination without preparing anything and restores it on reopening", async () => {
  const user = userEvent.setup();
  const { props } = setup();
  await user.click(trigger());
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(props.onApply).not.toHaveBeenCalled();
  expect(trigger()).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(
    screen.getByRole("button", { name: /^collector.eth / })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  ).toHaveAttribute("aria-pressed", "false");
});

it("requires a valid nonzero destination and a fresh acknowledgment after every external edit", async () => {
  const user = userEvent.setup();
  const { props } = setup();
  await user.click(trigger());
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  expect(
    screen.getByRole("textbox", { name: "Find a profile, ENS or wallet" })
  ).toBeVisible();
  const direct = screen.getByRole("textbox", {
    name: "Or enter a wallet address directly",
  });
  for (const value of ["invalid", zeroAddress]) {
    fireEvent.change(direct, { target: { value } });
    expect(applyButton()).toBeDisabled();
    expect(direct).toHaveAttribute("aria-invalid", "true");
  }
  fireEvent.change(direct, { target: { value: fren } });
  expect(applyButton()).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  expect(applyButton()).toBeEnabled();
  fireEvent.change(direct, {
    target: { value: "0x1111111111111111111111111111111111111111" },
  });
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(applyButton()).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  await user.click(applyButton());
  expect(props.onApply).toHaveBeenCalledWith(
    "0x1111111111111111111111111111111111111111",
    true
  );
});

it("uses the mint search to select a fren's exact wallet without preparing or publishing automatically", async () => {
  const user = userEvent.setup();
  jest.mocked(commonApiFetch).mockResolvedValue([
    {
      profile_id: "fren",
      handle: "fren",
      wallet: fren,
      primary_wallet: fren,
      display: "fren.eth",
      level: 1,
      tdh: 0,
    },
  ]);
  jest.mocked(useIdentity).mockImplementation(({ handleOrWallet }) => ({
    profile: handleOrWallet
      ? ({
          id: "fren",
          primary_wallet: fren,
          wallets: [{ wallet: fren, display: "fren.eth", tdh: 0 }],
        } as ApiIdentity)
      : null,
    isLoading: false,
  }));
  const { props } = setup();
  await user.click(trigger());
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  fireEvent.change(
    screen.getByRole("textbox", { name: "Find a profile, ENS or wallet" }),
    { target: { value: "fren.eth" } }
  );
  await waitFor(() =>
    expect(
      screen.getByText(getAddress(fren), { selector: "code" })
    ).toBeVisible()
  );
  expect(
    screen.getByText(getAddress(fren), { selector: "code" })
  ).toBeVisible();
  expect(props.onApply).not.toHaveBeenCalled();
  expect(applyButton()).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  await user.click(applyButton());
  expect(props.onApply).toHaveBeenCalledWith(getAddress(fren), true);
});

it("clears a previously acknowledged direct address immediately when a new search starts", async () => {
  const user = userEvent.setup();
  const { props } = setup();
  await user.click(trigger());
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  const direct = screen.getByRole("textbox", {
    name: "Or enter a wallet address directly",
  });
  fireEvent.change(direct, { target: { value: fren } });
  await user.click(screen.getByRole("checkbox"));
  expect(applyButton()).toBeEnabled();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Find a profile, ENS or wallet" }),
    { target: { value: "new-fr" } }
  );
  expect(direct).toHaveValue("");
  expect(applyButton()).toBeDisabled();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(props.onApply).not.toHaveBeenCalled();
  expect(commonApiFetch).not.toHaveBeenCalled();
});

it("locks the editor during apply, prevents duplicate calls and retains the draft after an unsuccessful update", async () => {
  let complete: (value: boolean) => void = () => undefined;
  const onApply = jest.fn(
    () =>
      new Promise<boolean>((resolve) => {
        complete = resolve;
      })
  );
  const user = userEvent.setup();
  const { props } = setup({ onApply });
  await user.click(trigger());
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  fireEvent.click(applyButton());
  expect(
    screen.getByRole("button", { name: "Updating delivery…" })
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  expect(trigger()).toBeDisabled();
  expect(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Updating delivery…" }));
  expect(onApply).toHaveBeenCalledTimes(1);
  await act(async () => {
    complete(false);
  });
  expect(trigger()).toHaveAttribute("aria-expanded", "true");
  expect(props.onEditingChange).toHaveBeenLastCalledWith(true);
  expect(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  ).toHaveAttribute("aria-pressed", "true");
  expect(applyButton()).toBeEnabled();
});

it("keeps the original wallet available and reports an unexpectedly rejected update for retry", async () => {
  const user = userEvent.setup();
  setup({
    onApply: jest.fn(async () => {
      throw new Error("offline");
    }),
  });
  await user.click(trigger());
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  await user.click(applyButton());
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Delivery could not be updated. Try again."
  );
  expect(trigger()).toHaveAttribute("aria-expanded", "true");
  expect(applyButton()).toBeEnabled();
});

it("does not open or prepare during a guarded wallet operation", async () => {
  const user = userEvent.setup();
  const { props } = setup({ disabled: true });
  await user.click(screen.getByText("Deliver to"));
  expect(
    screen.queryByRole("button", { name: "Use this address" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Copy wallet address" })
  ).toBeVisible();
  expect(screen.getByText(getAddress(primary))).toBeVisible();
  expect(props.onEditingChange).not.toHaveBeenCalled();
  expect(props.onApply).not.toHaveBeenCalled();
});

it("retains the authoritative external-destination marker when collapsed and locked", () => {
  const { props, rerender } = setup({ recipientInProfile: false });
  expect(screen.getByText("Outside the collecting profile")).toBeVisible();
  rerender(<CollectReviewRecipient {...props} disabled />);
  expect(screen.getByText("Outside the collecting profile")).toBeVisible();
});

it("ignores a completed apply after its operation scope unmounts", async () => {
  let complete: (value: boolean) => void = () => undefined;
  const user = userEvent.setup();
  const { props, unmount } = setup({
    onApply: () =>
      new Promise<boolean>((resolve) => {
        complete = resolve;
      }),
  });
  await user.click(trigger());
  await user.click(applyButton());
  unmount();
  await act(async () => {
    complete(true);
  });
  expect(props.onEditingChange).toHaveBeenCalledTimes(1);
  expect(props.onEditingChange).toHaveBeenLastCalledWith(true);
});

it("copies the selected exact checksummed address rather than its name", async () => {
  const user = userEvent.setup();
  const writeText = jest
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue();
  setup();
  await user.click(trigger());
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  await user.click(screen.getByRole("button", { name: "Copy wallet address" }));
  expect(writeText).toHaveBeenCalledWith(getAddress(custody));
  expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
  await user.click(screen.getByRole("button", { name: /^collector.eth / }));
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  writeText.mockRestore();
});
