import CollectRecipientPicker from "@/components/collect/CollectRecipientPicker";
import CollectTradeForm from "@/components/collect/CollectTradeForm";
import type { CollectTradeDraft } from "@/components/collect/collect.types";
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
import { useState, type ReactNode } from "react";
import { getAddress } from "viem";

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
const mockFrenProfile = {
  id: "fren",
  primary_wallet: fren,
  wallets: [{ wallet: fren, display: "fren.eth", tdh: 0 }],
};
const frenResult = {
  profile_id: "fren",
  handle: "fren",
  wallet: fren,
  primary_wallet: fren,
  display: "fren.eth",
  level: 1,
  tdh: 0,
};

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: jest.fn(),
}));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/server.helpers", () => ({ getUserProfile: jest.fn() }));
jest.mock("@/components/nft-transfer/TransferModalPfp", () => () => null);

function withQuery(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function Picker({
  initialValue = primary,
  recipientProfile = profile,
  payingWallet,
  onChange = jest.fn(),
}: {
  readonly initialValue?: string;
  readonly recipientProfile?: ApiIdentity | null;
  readonly payingWallet?: string;
  readonly onChange?: (address: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <CollectRecipientPicker
        profile={recipientProfile}
        {...(payingWallet ? { payingWallet } : {})}
        value={value}
        invalid={false}
        errorId="recipient-error"
        onChange={(address) => {
          setValue(address);
          onChange(address);
        }}
      />
      <output aria-label="Selected recipient">{value}</output>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(commonApiFetch).mockResolvedValue([frenResult]);
  jest.mocked(useIdentity).mockImplementation(({ handleOrWallet }) => ({
    profile: handleOrWallet ? (mockFrenProfile as ApiIdentity) : null,
    isLoading: false,
  }));
});

it("immediately shows every confirmed wallet, preserving primary selection and full addresses", async () => {
  const onChange = jest.fn();
  withQuery(<Picker onChange={onChange} />);
  expect(
    screen.getByRole("button", { name: /collector.eth 0x5290/i })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  ).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByText(getAddress(custody))).toBeVisible();
  expect(commonApiFetch).not.toHaveBeenCalled();
  expect(useIdentity).toHaveBeenCalledWith({
    handleOrWallet: "",
    initialProfile: null,
  });
  expect(onChange).not.toHaveBeenCalled();

  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(getAddress(custody));
  expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
    custody
  );
  await user.click(screen.getByRole("button", { name: "My profile wallets" }));
  expect(onChange).toHaveBeenCalledTimes(1);
});

it("retains confirmed profile wallets while unrelated identity data is incomplete or loading", () => {
  jest.mocked(useIdentity).mockReturnValue({
    profile: mockFrenProfile as ApiIdentity,
    isLoading: true,
  });
  withQuery(<Picker initialValue={custody} />);
  expect(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: /collector.eth 0x5290/i })
  ).toBeVisible();
  expect(screen.queryByText("fren.eth")).not.toBeInTheDocument();
});

it.each([custody, fren])(
  "preserves an explicit initial goal-plan recipient: %s",
  (initialValue) => {
    const onChange = jest.fn();
    withQuery(<Picker initialValue={initialValue} onChange={onChange} />);
    expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
      initialValue
    );
    expect(onChange).not.toHaveBeenCalled();
  }
);

it("clears the external destination and restores the primary wallet when returning to my profile", async () => {
  withQuery(<Picker />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  expect(screen.getByLabelText("Selected recipient")).toBeEmptyDOMElement();
  expect(
    screen.queryByRole("button", { name: /custody.collector.eth/ })
  ).not.toBeInTheDocument();
  fireEvent.change(
    screen.getByLabelText("Or enter a wallet address directly"),
    {
      target: { value: fren },
    }
  );
  expect(screen.getByText(getAddress(fren), { selector: "p" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "My profile wallets" }));
  expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
    getAddress(primary)
  );
  expect(screen.queryByText("fren.eth")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /collector.eth 0x5290/i })
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  ).toHaveAttribute("aria-pressed", "false");
});

it.each([null, { ...profile, wallets: undefined, primary_wallet: "invalid" }])(
  "does not invent confirmed wallets when the profile wallet list is unavailable: %j",
  (recipientProfile) => {
    withQuery(
      <Picker
        initialValue=""
        recipientProfile={recipientProfile as ApiIdentity | null}
      />
    );
    expect(
      screen.queryByRole("button", { name: /collector.eth/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send to a fren" })
    ).toBeVisible();
    expect(commonApiFetch).not.toHaveBeenCalled();
  }
);

it("resolves a fren's ENS through the mint selector and reviews its full checksummed destination", async () => {
  const onChange = jest.fn();
  withQuery(<Picker onChange={onChange} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  const search = screen.getByPlaceholderText(
    "Search profile by handle, ENS or wallet"
  );
  fireEvent.change(search, { target: { value: "fren.eth" } });
  await waitFor(() =>
    expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
      getAddress(fren)
    )
  );
  expect(screen.getByText(getAddress(fren), { selector: "p" })).toBeVisible();
  expect(onChange).toHaveBeenLastCalledWith(getAddress(fren));
  expect(screen.getByText(/Delivery outside this profile/)).toBeVisible();
});

it("restores the confirmed paying wallet when returning from Send to a fren", async () => {
  withQuery(<Picker payingWallet={custody} initialValue={fren} />);
  await userEvent.click(
    screen.getByRole("button", { name: "My profile wallets" })
  );
  expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
    custody
  );
});

it.each([undefined, []])(
  "uses the confirmed primary wallet when the optional wallet array is unavailable: %j",
  (wallets) => {
    withQuery(
      <Picker recipientProfile={{ ...profile, wallets } as ApiIdentity} />
    );
    expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
      primary
    );
    expect(screen.getByText(/Delivery to this profile/)).toBeVisible();
    expect(screen.queryByText("custody.collector.eth")).not.toBeInTheDocument();
    expect(commonApiFetch).not.toHaveBeenCalled();
  }
);

it("ignores a pending ENS result after switching back to profile wallets", async () => {
  let resolveSearch!: (value: (typeof frenResult)[]) => void;
  jest.mocked(commonApiFetch).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSearch = resolve;
      })
  );
  withQuery(<Picker />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  fireEvent.change(
    screen.getByPlaceholderText("Search profile by handle, ENS or wallet"),
    {
      target: { value: "fren.eth" },
    }
  );
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
  await user.click(screen.getByRole("button", { name: "My profile wallets" }));
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  await act(async () => resolveSearch([frenResult]));
  expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
    custody
  );
  expect(screen.queryByText(getAddress(fren))).not.toBeInTheDocument();
});

it("keeps a directly entered destination after resolving a different ENS", async () => {
  withQuery(<Picker />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  fireEvent.change(
    screen.getByPlaceholderText("Search profile by handle, ENS or wallet"),
    {
      target: { value: "fren.eth" },
    }
  );
  await waitFor(() =>
    expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
      getAddress(fren)
    )
  );
  const directInput = screen.getByLabelText(
    "Or enter a wallet address directly"
  );
  await user.click(directInput);
  fireEvent.change(directInput, {
    target: { value: custody },
  });
  await waitFor(() =>
    expect(screen.getByLabelText("Selected recipient")).toHaveTextContent(
      custody
    )
  );
  expect(screen.queryByText("fren.eth")).not.toBeInTheDocument();
  expect(directInput).toHaveFocus();
});

it("does not auto-select an old ENS result after the user edits the current search", async () => {
  let resolveSearch!: (value: (typeof frenResult)[]) => void;
  jest.mocked(commonApiFetch).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSearch = resolve;
      })
  );
  withQuery(<Picker />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Send to a fren" }));
  const search = screen.getByPlaceholderText(
    "Search profile by handle, ENS or wallet"
  );
  fireEvent.change(search, { target: { value: "fren.eth" } });
  await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(1));
  fireEvent.change(search, { target: { value: "other.eth" } });
  await act(async () => resolveSearch([frenResult]));
  await waitFor(() => expect(screen.getByText("fren")).toBeVisible());
  expect(screen.getByLabelText("Selected recipient")).toBeEmptyDOMElement();
  expect(search).toHaveValue("other.eth");
  expect(search).toBeInTheDocument();
});

it("passes the selected custody wallet to trade review while keeping the payer separate", async () => {
  const onPrepare = jest.fn();
  function Purchase() {
    const [draft, setDraft] = useState<CollectTradeDraft>({
      quantity: "1",
      unitPriceEth: "",
      expiryHours: "168",
      recipient: primary,
    });
    return (
      <CollectTradeForm
        action="buy"
        draft={draft}
        maxQuantity="1"
        makerLabel={primary}
        currencyLabel="ETH"
        recipientProfile={profile}
        loading={false}
        onChange={setDraft}
        onPrepare={onPrepare}
      />
    );
  }
  withQuery(<Purchase />);
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: /custody.collector.eth/ })
  );
  expect(screen.getByText(`Paying wallet: ${primary}`)).toBeVisible();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  expect(onPrepare).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Review exact terms" }));
  expect(onPrepare).toHaveBeenCalledTimes(1);
  expect(onPrepare).toHaveBeenCalledWith(
    expect.objectContaining({
      recipient: getAddress(custody),
      acknowledgeExternalRecipient: false,
    })
  );
});
