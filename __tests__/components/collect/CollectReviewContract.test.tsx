import CollectReviewContract from "@/components/collect/CollectReviewContract";
import type { CollectContractRole } from "@/components/collect/collect-contract-identity";
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

const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const GRADIENT = "0x0c58ef43ff3032005e472cb5709f8908acb00205";
const SEAPORT = "0x0000000000000068f116a894984e2db1123eb395";
const OPENSEA_FEE = "0x0000a26b00c1f0df003000390027140000faa719";
const UNKNOWN = "0x52908400098527886e0f7030069857d2e4169ee7";
const originalClipboard = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard"
);

afterEach(() => {
  if (originalClipboard)
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  else Reflect.deleteProperty(navigator, "clipboard");
});

function clipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

it.each<[string, CollectContractRole, string, string]>([
  [MEMES, "nft", "The Memes", "NFT contract"],
  [GRADIENT, "nft", "6529 Gradient", "NFT contract"],
  [
    "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
    "nft",
    "NextGen",
    "NFT contract",
  ],
  [SEAPORT, "exchange", "Seaport 1.6", "Exchange contract"],
  [OPENSEA_FEE, "fee", "OpenSea", "Marketplace fee"],
])(
  "shows the verified identity and role with a collapsed exact address: %s",
  (address, role, name, label) => {
    render(<CollectReviewContract chainId={1} address={address} role={role} />);
    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText(label)).toBeVisible();
    const fullAddress = screen.getByText(getAddress(address));
    expect(screen.getAllByText(getAddress(address))).toHaveLength(1);
    expect(fullAddress).not.toBeVisible();
    expect(fullAddress.closest("details")).not.toHaveAttribute("open");
    fireEvent.click(screen.getByText(name));
    expect(fullAddress).toBeVisible();
    expect(fullAddress).toHaveAttribute("dir", "ltr");
    expect(fullAddress).toHaveClass("tw-break-all", "tw-select-text");
    expect(
      screen.getByRole("button", { name: `Copy ${name} address` })
    ).toHaveClass("tw-size-11", "tw-shrink-0");
  }
);

it.each<[number | undefined, string, CollectContractRole, string, string]>([
  [137, MEMES, "nft", "Unknown contract", "NFT contract"],
  [undefined, SEAPORT, "exchange", "Unknown contract", "Exchange contract"],
  [1, SEAPORT, "nft", "Unknown contract", "NFT contract"],
  [1, MEMES, "exchange", "Unknown contract", "Exchange contract"],
  [1, OPENSEA_FEE, "approval", "Unknown contract", "Approval contract"],
  [1, MEMES, "fee", "Unknown recipient", "Order fee"],
  [137, OPENSEA_FEE, "fee", "Unknown recipient", "Order fee"],
  [1, UNKNOWN, "fee", "Unknown recipient", "Order fee"],
])(
  "keeps an unverified chain/address/role combination unbranded: %s / %s / %s",
  (chainId, address, role, name, label) => {
    render(
      <CollectReviewContract chainId={chainId} address={address} role={role} />
    );
    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText(label)).toBeVisible();
    for (const known of [
      "The Memes",
      "6529 Gradient",
      "NextGen",
      "Seaport 1.6",
      "OpenSea",
    ])
      expect(screen.queryByText(known)).not.toBeInTheDocument();
    expect(screen.getByText(getAddress(address))).not.toBeVisible();
    if (chainId !== 1)
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
  }
);

it.each([
  [SEAPORT, "Seaport 1.6"],
  [UNKNOWN, "Unknown contract"],
])(
  "links a valid mainnet address to its exact Etherscan page: %s",
  (address, name) => {
    render(
      <CollectReviewContract chainId={1} address={address} role="exchange" />
    );
    const link = screen.getByRole("link", {
      name: `Open ${name} on Etherscan`,
    });
    expect(link).toHaveAttribute(
      "href",
      `https://etherscan.io/address/${getAddress(address)}`
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
);

it.each(["not an address", `${MEMES}?label=OpenSea`, ` ${MEMES}`])(
  "preserves invalid raw input without a trusted explorer link: %s",
  (address) => {
    render(<CollectReviewContract chainId={1} address={address} role="nft" />);
    expect(screen.getByText("Unknown contract")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Unknown contract"));
    const code = screen.getByText(address.trim());
    expect(code.textContent).toBe(address);
    expect(code).toBeVisible();
  }
);

it("opens the exact address and copies its checksum directly from the collapsed row", async () => {
  const writeText = jest.fn(async (_text: string) => {});
  clipboard(writeText);
  render(<CollectReviewContract chainId={1} address={MEMES} role="nft" />);
  const fullAddress = screen.getByText(getAddress(MEMES));
  expect(fullAddress).not.toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Copy The Memes address" })
  );
  expect(fullAddress).toBeVisible();
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(getAddress(MEMES));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Copied")
  );
});

it("supports keyboard copying after pointer disclosure", async () => {
  const user = userEvent.setup();
  const writeText = jest.fn(async (_text: string) => {});
  clipboard(writeText);
  render(
    <CollectReviewContract chainId={1} address={SEAPORT} role="exchange" />
  );
  fireEvent.click(screen.getByText("Seaport 1.6"));
  expect(screen.getByText(getAddress(SEAPORT))).toBeVisible();
  await user.tab();
  expect(screen.getByRole("button")).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(writeText).toHaveBeenCalledWith(getAddress(SEAPORT));
  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent("Copied")
  );
});

it.each(["missing", "rejected"])(
  "reports a %s clipboard truthfully and leaves the exact address selectable",
  async (failure) => {
    if (failure === "missing")
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: undefined,
      });
    else
      clipboard(async () => {
        throw new Error("Private clipboard failure detail");
      });
    render(<CollectReviewContract chainId={1} address={MEMES} role="nft" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Copy The Memes address" })
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Copy failed")
    );
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.getByRole("status")).not.toHaveTextContent("Copied");
    expect(screen.getByText(getAddress(MEMES))).toBeVisible();
    expect(screen.getByText(getAddress(MEMES))).toHaveClass("tw-select-text");
    expect(
      screen.queryByText(/Private clipboard failure/)
    ).not.toBeInTheDocument();
  }
);

const identityChanges: ReadonlyArray<{
  changed: string;
  chainId: number;
  address: string;
  role: CollectContractRole;
  name: string;
}> = [
  {
    changed: "address",
    chainId: 1,
    address: GRADIENT,
    role: "nft",
    name: "6529 Gradient",
  },
  {
    changed: "chain",
    chainId: 137,
    address: MEMES,
    role: "nft",
    name: "Unknown contract",
  },
  {
    changed: "role",
    chainId: 1,
    address: MEMES,
    role: "approval",
    name: "Unknown contract",
  },
];

it.each(
  identityChanges.flatMap((change) =>
    ["resolved", "rejected"].map((outcome) => ({ ...change, outcome }))
  )
)(
  "does not publish an old $outcome clipboard result after the $changed changes",
  async ({ chainId, address, role, name, outcome }) => {
    let finishCopy: (() => void) | undefined;
    const writeText = jest.fn(
      () =>
        new Promise<void>((resolve, reject) => {
          finishCopy =
            outcome === "resolved"
              ? resolve
              : () => reject(new Error("Old clipboard failure"));
        })
    );
    clipboard(writeText);
    const { rerender } = render(
      <CollectReviewContract chainId={1} address={MEMES} role="nft" />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Copy The Memes address" })
    );
    expect(writeText).toHaveBeenCalledWith(getAddress(MEMES));
    expect(finishCopy).toBeDefined();
    rerender(
      <CollectReviewContract chainId={chainId} address={address} role={role} />
    );
    await act(async () => finishCopy?.());
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByText(name)).toBeVisible();
    expect(screen.getByText(getAddress(address))).not.toBeVisible();
    expect(screen.queryByText("The Memes")).not.toBeInTheDocument();
    if (address !== MEMES)
      expect(screen.queryByText(getAddress(MEMES))).not.toBeInTheDocument();
  }
);
