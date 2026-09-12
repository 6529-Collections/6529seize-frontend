import CollectReviewWallet from "@/components/collect/CollectReviewWallet";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getAddress } from "viem";

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

const ADDRESS = "0xf58fe66af1a8c792cd64d8d706eddabadfcb2fd0";
const OTHER_ADDRESS = "0xfdf8bcf56af0584026f9db963381db72c5cc8e3b";
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);

afterEach(() => {
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
});

function clipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

it("shows the trusted name and full checksum by default, without a link or disclosure", () => {
  render(
    <CollectReviewWallet
      address={ADDRESS}
      name="punk6529bot.eth"
      label="Pay with & deliver to"
      detail="2 editions"
    />
  );
  expect(screen.getByText("punk6529bot.eth")).toBeVisible();
  const fullAddress = screen.getByText(getAddress(ADDRESS));
  expect(fullAddress).toBeVisible();
  expect(fullAddress).toHaveAttribute("dir", "ltr");
  expect(fullAddress).toHaveClass("tw-break-all", "tw-select-text");
  expect(screen.getByText("2 editions")).toBeVisible();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  const button = screen.getByRole("button", { name: "Copy wallet address" });
  expect(button).toHaveAccessibleDescription(
    `Pay with & deliver to punk6529bot.eth ${getAddress(ADDRESS)}`
  );
  expect(button).toHaveClass("tw-size-11", "tw-shrink-0");
});

it("keeps an unnamed or address-named destination exact without duplicate addresses", () => {
  const { rerender } = render(
    <CollectReviewWallet address={ADDRESS} label="Deliver to" />
  );
  expect(screen.getAllByText(getAddress(ADDRESS))).toHaveLength(1);
  rerender(
    <CollectReviewWallet address={ADDRESS} name={ADDRESS} label="Deliver to" />
  );
  expect(screen.getAllByText(getAddress(ADDRESS))).toHaveLength(1);
  expect(screen.queryByText(ADDRESS)).not.toBeInTheDocument();
});

it("copies the exact checksummed address with the keyboard, never the supplied name", async () => {
  const user = userEvent.setup();
  const writeText = jest.fn(async (_text: string) => {});
  clipboard(writeText);
  render(
    <CollectReviewWallet
      address={ADDRESS}
      name="punk6529bot.eth"
      label="Pay with"
    />
  );
  await user.tab();
  expect(screen.getByRole("button")).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(getAddress(ADDRESS));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Copied")
  );
});

it.each(["missing", "rejected"])(
  "shows truthful feedback for a %s clipboard and preserves the selectable full address",
  async (failure) => {
    if (failure === "missing") {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      });
    } else {
      clipboard(async () => {
        throw new Error("Private clipboard failure detail");
      });
    }
    render(<CollectReviewWallet address={ADDRESS} label="Deliver to" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Copy wallet address" })
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Copy failed")
    );
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.getByText(getAddress(ADDRESS))).toBeVisible();
    expect(
      screen.queryByText(/Private clipboard failure/)
    ).not.toBeInTheDocument();
  }
);

it("does not announce an old clipboard result for a changed authoritative wallet", async () => {
  let finishCopy: (() => void) | undefined;
  clipboard(
    () =>
      new Promise<void>((resolve) => {
        finishCopy = resolve;
      })
  );
  const { rerender } = render(
    <CollectReviewWallet
      address={ADDRESS}
      name="first.eth"
      label="Deliver to"
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Copy wallet address" }));
  rerender(
    <CollectReviewWallet
      address={OTHER_ADDRESS}
      name="second.eth"
      label="Deliver to"
    />
  );
  await act(async () => finishCopy?.());
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(screen.getByText("second.eth")).toBeVisible();
  expect(screen.getByText(getAddress(OTHER_ADDRESS))).toBeVisible();
  expect(screen.queryByText(getAddress(ADDRESS))).not.toBeInTheDocument();
});
