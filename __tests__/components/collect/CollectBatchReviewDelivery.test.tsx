import CollectBatchQuoteReview from "@/components/collect/CollectBatchQuoteReview";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { getAddress } from "viem";
import { batchFixture, FREN, PAYER } from "./market-batch.fixture";

const custody = "0xde709f2102306220921060314715629080e2fb77";
const outside = "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed";
const profile = {
  id: "profile",
  handle: "collector",
  primary_wallet: PAYER,
  level: 12,
  tdh: 1500,
  wallets: [
    { wallet: PAYER, display: "collector.eth", tdh: 1000 },
    { wallet: custody, display: "custody.collector.eth", tdh: 500 },
  ],
} as ApiIdentity;

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useIdentity", () => ({ useIdentity: jest.fn() }));
jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
jest.mock("@/helpers/server.helpers", () => ({ getUserProfile: jest.fn() }));
jest.mock("@/components/nft-transfer/TransferModalPfp", () => () => null);
jest.mock("@/components/collect/CollectAssetMedia", () => () => null);

type Props = ComponentProps<typeof CollectBatchQuoteReview>;
function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    operation: batchFixture().operation,
    items: [],
    profile,
    busy: false,
    walletNames: {
      [PAYER]: "collector.eth",
      [FREN]: "fren.eth",
      [custody]: "custody.collector.eth",
    },
    onConfirm: jest.fn(async () => {}),
    onEdit: jest.fn(),
    onClose: jest.fn(),
    onRecipientChange: jest.fn(async () => true),
    onRecipientEditingChange: jest.fn(),
    ...overrides,
  };
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    ...render(<CollectBatchQuoteReview {...props} />, { wrapper }),
    props,
  };
}
function allocation(itemIndex = 0, name = "Deliver 1 fren.eth") {
  return within(screen.getAllByRole("listitem")[itemIndex]!).getByRole(
    "button",
    { name }
  );
}
const continueButton = () =>
  screen.getByRole("button", { name: "Continue in wallet" });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useIdentity).mockReturnValue({ profile: null, isLoading: false });
  jest.mocked(commonApiFetch).mockResolvedValue([]);
});

it("edits one exact allocation with the shared identity chooser and fences the other purchase actions", async () => {
  const user = userEvent.setup();
  const { props } = setup();
  const original = JSON.stringify(props.operation);
  await user.click(allocation());
  expect(props.onRecipientEditingChange).toHaveBeenLastCalledWith(true);
  expect(continueButton()).toBeDisabled();
  expect(screen.getByRole("button", { name: "Edit purchase" })).toBeDisabled();
  expect(screen.getAllByRole("button", { name: /^Deliver 1 / })).toHaveLength(
    1
  );
  await user.click(screen.getByRole("button", { name: "Send to me" }));
  expect(screen.getByText("Profile level 12")).toBeVisible();
  expect(screen.getByText("Profile TDH: 1,500")).toBeVisible();
  await user.click(
    screen.getByRole("button", { name: /^custody.collector.eth / })
  );
  expect(props.onRecipientChange).not.toHaveBeenCalled();
  expect(commonApiFetch).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Use this address" }));
  expect(props.onRecipientChange).toHaveBeenCalledWith(
    0,
    0,
    getAddress(custody),
    false
  );
  expect(JSON.stringify(props.operation)).toBe(original);
  expect(props.onConfirm).not.toHaveBeenCalled();
  expect(props.onEdit).not.toHaveBeenCalled();
  expect(props.onRecipientEditingChange).toHaveBeenLastCalledWith(false);
  expect(continueButton()).toBeEnabled();
  expect(allocation()).toHaveFocus();
});

it("preserves a split allocation's exact indices and requires consent for its new external address", async () => {
  const user = userEvent.setup();
  const { props } = setup();
  const original = JSON.stringify(props.operation.items);
  await user.click(allocation(1));
  const address = screen.getByRole("textbox", {
    name: "Or enter a wallet address directly",
  });
  await user.clear(address);
  await user.type(address, outside);
  expect(
    screen.getByRole("button", { name: "Use this address" })
  ).toBeDisabled();
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Use this address" }));
  expect(props.onRecipientChange).toHaveBeenCalledWith(
    1,
    1,
    getAddress(outside),
    true
  );
  expect(JSON.stringify(props.operation.items)).toBe(original);
});

it("cancels a destination draft without preparing or losing the original split", async () => {
  const user = userEvent.setup();
  const { props } = setup();
  await user.click(allocation(1));
  await user.click(screen.getByRole("button", { name: "Send to me" }));
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(props.onRecipientChange).not.toHaveBeenCalled();
  expect(allocation(1)).toHaveFocus();
  expect(continueButton()).toBeEnabled();
  expect(screen.getAllByRole("button", { name: /^Deliver 1 / })).toHaveLength(
    3
  );
});

it("keeps a failed update editable and replaces successful-review focus without retaining old edit state", async () => {
  const user = userEvent.setup();
  let resolveUpdate: (value: boolean) => void = () => {};
  const { props, rerender } = setup({
    onRecipientChange: jest.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveUpdate = resolve;
        })
    ),
  });
  await user.click(allocation());
  await user.click(screen.getByRole("button", { name: "Send to me" }));
  await user.click(screen.getByRole("button", { name: "Use this address" }));
  expect(
    screen.getByRole("button", { name: "Updating delivery…" })
  ).toBeDisabled();
  await act(async () => resolveUpdate(false));
  expect(allocation()).toHaveAttribute("aria-expanded", "true");
  expect(continueButton()).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Use this address" }));
  const updated = {
    ...props.operation,
    id: "replacement-operation",
    items: props.operation.items.map((item, index) =>
      index === 0
        ? {
            ...item,
            allocations: [
              {
                ...item.allocations[0]!,
                recipient: PAYER,
                recipient_in_profile: true,
                acknowledge_external_recipient: false,
              },
            ],
          }
        : item
    ),
  };
  rerender(<CollectBatchQuoteReview {...props} operation={updated} />);
  await act(async () => resolveUpdate(true));
  expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  expect(allocation(0, "Deliver 1 collector.eth")).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(props.onRecipientEditingChange).toHaveBeenLastCalledWith(false);
  expect(continueButton()).toBeEnabled();
  rerender(<CollectBatchQuoteReview {...props} />);
  expect(allocation()).toHaveAttribute("aria-expanded", "false");
  expect(continueButton()).toBeEnabled();
});

it("preserves a same-operation draft across quote revisions and callback refreshes, then invalidates changed membership", async () => {
  const user = userEvent.setup();
  const { props, rerender } = setup();
  await user.click(allocation());
  await user.click(screen.getByRole("button", { name: "Send to me" }));
  await user.click(
    screen.getByRole("button", { name: /^custody.collector.eth / })
  );
  const nextCallback = jest.fn();
  rerender(
    <CollectBatchQuoteReview
      {...props}
      operation={{ ...props.operation, revision: "2" }}
      onRecipientEditingChange={nextCallback}
    />
  );
  expect(
    screen.getByRole("button", { name: /^custody.collector.eth / })
  ).toHaveAttribute("aria-pressed", "true");
  expect(continueButton()).toBeDisabled();
  expect(nextCallback).not.toHaveBeenCalledWith(false);
  rerender(
    <CollectBatchQuoteReview
      {...props}
      profile={{
        ...profile,
        wallets: [profile.wallets![0]!],
      }}
    />
  );
  await waitFor(() =>
    expect(allocation()).toHaveAttribute("aria-expanded", "false")
  );
  expect(continueButton()).toBeEnabled();
});

it.each(["busy", "blocked", "submitted", "read-only"])(
  "keeps destination controls unavailable when %s",
  (state) => {
    const overrides: Record<string, Partial<Props>> = {
      busy: { busy: true },
      blocked: { disabledReason: "Check purchase status" },
      submitted: {
        operation: {
          ...batchFixture().operation,
          state: ApiMarketBatchOperationStateEnum.Submitted,
        },
      },
      "read-only": { profile: null },
    };
    setup(overrides[state]);
    expect(
      screen.queryByRole("button", { name: /^Deliver 1 / })
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Deliver 1");
  }
);

it("clears an abandoned editor when update capability disappears and returns for the same operation", async () => {
  const user = userEvent.setup();
  const { props, rerender } = setup();
  await user.click(allocation());
  expect(continueButton()).toBeDisabled();
  const { onRecipientChange: _onRecipientChange, ...readOnly } = props;
  rerender(<CollectBatchQuoteReview {...readOnly} />);
  expect(props.onRecipientEditingChange).toHaveBeenLastCalledWith(false);
  rerender(<CollectBatchQuoteReview {...props} />);
  expect(allocation()).toHaveAttribute("aria-expanded", "false");
  expect(continueButton()).toBeEnabled();
});
