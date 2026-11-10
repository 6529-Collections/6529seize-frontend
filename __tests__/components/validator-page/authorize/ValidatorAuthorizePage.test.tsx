import { act, fireEvent, render, screen } from "@testing-library/react";

import ValidatorAuthorizePage from "@/components/validator-page/authorize/ValidatorAuthorizePage";
import { groupedPublicKey } from "@/lib/validator-page/authorize/display";
import { MAINNET_SALT } from "@/lib/validator-page/authorize/typedData";

import fixture from "../../../lib/validator-page/authorize/fixture-grant.json";

type Wallet = {
  address: string | undefined;
  isConnected: boolean;
  isSafeWallet: boolean;
  seizeConnect: jest.Mock;
  seizeConnectFresh: jest.Mock;
};

let wallet: Wallet;
const signTypedDataAsync = jest.fn();

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => wallet,
}));
jest.mock("wagmi", () => ({
  useAccount: () => ({
    address: wallet.address,
    isConnected: wallet.isConnected,
  }),
  useSignTypedData: () => ({ signTypedDataAsync }),
}));

const FRAGMENT = fixture.link.split("#")[1]!;
const LINK_BYTES = Buffer.from(FRAGMENT, "base64url");
// format, network, account, authVersion (1 byte), refBlockNumber (4 bytes)
// and refBlockHash come before n.
const N_OFFSET = 59;
const OTHER_CODE = (
  JSON.parse(fixture.typed_data) as { message: { keys: { pubkey: string }[] } }
).message.keys[0]!.pubkey.slice(-8);
const PURPOSE =
  "These keys may sign daily TDH roots for this account and nothing else. They cannot move NFTs or funds.";
const SHORT_ACCOUNT = "0xd580…2c77";

/** The fixture's draft as a stop: no keys. */
const STOP_FRAGMENT = Buffer.concat([
  LINK_BYTES.subarray(0, N_OFFSET),
  Buffer.from([0, 0, 0]),
]).toString("base64url");

/** The fixture's draft on a test network, with its own salt. */
const TEST_FRAGMENT = Buffer.concat([
  Buffer.from([1, 1]),
  Buffer.alloc(32, 0x11),
  LINK_BYTES.subarray(2),
]).toString("base64url");

/** A test network link that carries the mainnet salt. */
const MAINNET_SALT_TEST_FRAGMENT = Buffer.concat([
  Buffer.from([1, 1]),
  Buffer.from(MAINNET_SALT.slice(2), "hex"),
  LINK_BYTES.subarray(2),
]).toString("base64url");

// The account ends at byte 22; the fixture's authVersion, 3, is one byte.
const VERSION_OFFSET = 22;

function leb128(value: number): number[] {
  const out: number[] = [];
  let rest = value;
  do {
    const low = rest % 128;
    rest = Math.floor(rest / 128);
    out.push(rest === 0 ? low : low + 128);
  } while (rest !== 0);
  return out;
}

/** The fixture's draft with another authorization number. */
function withAuthVersion(version: number): string {
  return Buffer.concat([
    LINK_BYTES.subarray(0, VERSION_OFFSET),
    Buffer.from(leb128(version)),
    LINK_BYTES.subarray(VERSION_OFFSET + 1),
  ]).toString("base64url");
}

function open(fragment: string | null) {
  globalThis.history.replaceState(
    null,
    "",
    fragment === null
      ? "/validator/authorize"
      : `/validator/authorize#${fragment}`
  );
  return render(<ValidatorAuthorizePage />);
}

function connect(address = fixture.account, isSafeWallet = false) {
  wallet = { ...wallet, address, isConnected: true, isSafeWallet };
}

beforeEach(() => {
  wallet = {
    address: undefined,
    isConnected: false,
    isSafeWallet: false,
    seizeConnect: jest.fn(),
    seizeConnectFresh: jest.fn(() => Promise.resolve()),
  };
  signTypedDataAsync.mockReset();
  globalThis.fetch = jest.fn(() =>
    Promise.reject(new Error("the page must not call the network"))
  ) as typeof fetch;
});

afterEach(() => {
  expect(globalThis.fetch).not.toHaveBeenCalled();
});

describe("the authorize page", () => {
  it("says what it is and how to get here when there is no link", async () => {
    open(null);
    expect(
      await screen.findByRole("heading", {
        name: "Sign for your validator on your phone",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This page lets the wallet on your phone authorize a 6529 Validator that runs on your computer. Your wallet signs one message. It costs no gas and moves nothing."
      )
    ).toBeInTheDocument();
    const steps = screen.getAllByRole("listitem").map((x) => x.textContent);
    expect(steps).toEqual([
      "On your computer, open 6529 Validator and go to Authorize, or to Keys, then Add a computer.",
      "Choose your phone as the wallet, and paste its address.",
      "Scan the code it shows with your phone, or open its link here.",
      "Sign here, then paste the signature into your validator.",
    ]);
    expect(
      screen.getByText(
        "Sign only if the key code on this page matches the one on your computer."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "What is the 6529 Validator?" })
    ).toHaveAttribute("href", "/validator");
    expect(
      screen.getByRole("heading", { name: "Authorize your validator" })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it.each([
    ["a damaged link", FRAGMENT.slice(0, -3)],
    ["a link with an extra byte", `${FRAGMENT}AA`],
    ["text that isn't a link", "K7QM-3XRD"],
  ])("refuses %s", async (_name, fragment) => {
    open(fragment);
    expect(
      await screen.findByText(
        "This link is incomplete or damaged. Scan the code again, or copy the link again from your validator."
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the validator's key and the whole draft", async () => {
    open(FRAGMENT);
    expect(await screen.findByText("Validator key")).toBeInTheDocument();
    // Large at the top, and again in the list of keys.
    expect(screen.getAllByText("9f3a2c71")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Authorize this validator key" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Check that your validator's screen shows the same key code. If it doesn't, or someone sent you this link, stop here."
      )
    ).toBeInTheDocument();
    expect(screen.getByText(fixture.account)).toBeInTheDocument();
    expect(screen.getByText(OTHER_CODE)).toBeInTheDocument();
    expect(screen.getAllByText("50%")).toHaveLength(2);
    expect(screen.getAllByText("this validator")).toHaveLength(1);
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText(PURPOSE)).toBeInTheDocument();
    expect(screen.queryByText("Test network")).not.toBeInTheDocument();
    // Every key in full, grouped, beside its code.
    expect(
      screen.getByText(groupedPublicKey(fixture.this_key))
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^0x( [0-9a-f]{8}){12}$/)).toHaveLength(2);
    // The other key holds half of the authorization.
    expect(
      screen.getByText(
        "One key here isn't marked as this validator's. It holds 50% of this account's authorization. Sign only if you know it, for example as the key of your other computer."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/is far above the number/)
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(wallet.seizeConnect).toHaveBeenCalledTimes(1);
  });

  it("tags a test network", async () => {
    open(TEST_FRAGMENT);
    expect(await screen.findByText("Test network")).toBeInTheDocument();
    expect(screen.getAllByText("9f3a2c71")).toHaveLength(2);
  });

  it("refuses a test network link that carries the mainnet salt", async () => {
    open(MAINNET_SALT_TEST_FRAGMENT);
    expect(
      await screen.findByText(
        "This link is incomplete or damaged. Scan the code again, or copy the link again from your validator."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Test network")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("warns about an authorization number far above any account's", async () => {
    open(withAuthVersion(10_000_000));
    expect(await screen.findByText("#10000000")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Authorization #10000000 is far above the number a validator drafts, which is one above the account's last authorization. A later authorization needs a larger number still. Don't sign unless you expected this number."
      )
    ).toBeInTheDocument();
  });

  it("warns when every key's share is held by keys not marked as this validator's", async () => {
    const fragment = Buffer.concat([
      LINK_BYTES.subarray(0, N_OFFSET + 1),
      Buffer.from([0, 0]),
      LINK_BYTES.subarray(N_OFFSET + 3),
    ]).toString("base64url");
    open(fragment);
    expect(
      await screen.findByText(
        "2 keys here aren't marked as this validator's. Together they hold 100% of this account's authorization. Sign only if you know each of them, for example as the keys of your other computers."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Validator key")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Authorize these keys" })
    ).toBeInTheDocument();
  });

  it("says plainly what a stop does", async () => {
    open(STOP_FRAGMENT);
    expect(
      await screen.findByRole("heading", { name: "Stop this account's keys" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "No key will sign for this account from the day it counts."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText("Validator key")).not.toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("reads a new link when the fragment changes", async () => {
    open(null);
    await screen.findByRole("heading", {
      name: "Sign for your validator on your phone",
    });
    act(() => {
      globalThis.history.replaceState(
        null,
        "",
        `/validator/authorize#${FRAGMENT}`
      );
      globalThis.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(await screen.findByText("Validator key")).toBeInTheDocument();
  });

  it("asks for the account's own wallet", async () => {
    connect(`0x${"AB".repeat(20)}`);
    open(FRAGMENT);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      `Connect ${SHORT_ACCOUNT}, the wallet your validator asked for. This wallet is 0xabab…abab.`
    );
    expect(
      screen.queryByRole("button", { name: "Sign in your wallet" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use another wallet" }));
    expect(wallet.seizeConnectFresh).toHaveBeenCalled();
  });

  it("won't sign with a Safe", async () => {
    connect(fixture.account, true);
    open(FRAGMENT);
    expect(
      await screen.findByText(
        "A vault such as a Safe can't sign in this version. Connect the ordinary wallet you use on 6529.io."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sign in your wallet" })
    ).not.toBeInTheDocument();
  });

  it("signs, turns a recovery byte of 1 into 28, and shows the signature to copy", async () => {
    connect(fixture.account.toUpperCase().replace("0X", "0x"));
    signTypedDataAsync.mockResolvedValue(
      `${fixture.signature.slice(0, 130)}01`
    );
    const writeText = jest.fn(() => Promise.resolve());
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    open(FRAGMENT);
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in your wallet" })
    );

    expect(
      await screen.findByRole("heading", { name: "Copy the signature" })
    ).toBeInTheDocument();
    expect(screen.getByText(fixture.signature)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Paste it into your validator's Authorize step, in the box for the signature."
      )
    ).toBeInTheDocument();
    // What was authorized, as signed: true whoever made the link.
    expect(
      screen.getByText(
        `This signature authorizes the keys ${OTHER_CODE} and 9f3a2c71 for ${SHORT_ACCOUNT}, as authorization #3. Nothing was sent anywhere.`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/only works on your validator/)
    ).not.toBeInTheDocument();

    const signed = signTypedDataAsync.mock.calls[0]![0];
    expect(signed.account).toBe(fixture.account);
    expect(signed.primaryType).toBe("ValidatorGrant");
    expect(signed.domain).toEqual({
      name: "6529 Validator",
      version: "1",
      salt: "0xa4d41ae1171d32737944fb118f91b8dba1d7084559658d457310a4bf12e52bf0",
    });
    expect(Object.keys(signed.types)).toEqual([
      "ValidatorGrant",
      "ValidatorKey",
    ]);
    expect(signed.message.authVersion).toBe(3n);
    expect(signed.message.refBlockNumber).toBe(21_500_123n);
    expect(signed.message.keys[1]).toEqual({
      pubkey: fixture.this_key,
      share: 5000,
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy signature" }));
    expect(await screen.findByText("Copied.")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(fixture.signature);
    Reflect.deleteProperty(globalThis.navigator, "clipboard");
  });

  it("asks to copy by hand when the browser has no clipboard", async () => {
    connect();
    signTypedDataAsync.mockResolvedValue(fixture.signature);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
      configurable: true,
    });
    open(FRAGMENT);
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in your wallet" })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Copy signature" })
    );
    expect(
      await screen.findByText("Select the text and copy it.")
    ).toBeInTheDocument();
    Reflect.deleteProperty(globalThis.navigator, "clipboard");
  });

  it("says when the wallet cancelled, and lets it sign again", async () => {
    connect();
    signTypedDataAsync.mockRejectedValueOnce(
      Object.assign(new Error("User rejected the request."), { code: 4001 })
    );
    open(FRAGMENT);
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in your wallet" })
    );
    expect(
      await screen.findByText(
        "You cancelled in your wallet. Nothing was signed."
      )
    ).toBeInTheDocument();
    signTypedDataAsync.mockResolvedValueOnce(fixture.signature);
    fireEvent.click(screen.getByRole("button", { name: "Sign again" }));
    expect(
      await screen.findByRole("heading", { name: "Copy the signature" })
    ).toBeInTheDocument();
  });

  it("says when the wallet didn't sign", async () => {
    connect();
    signTypedDataAsync.mockRejectedValue(new Error("Chain mismatch"));
    open(FRAGMENT);
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in your wallet" })
    );
    expect(
      await screen.findByText("Your wallet didn't sign. Try again.")
    ).toBeInTheDocument();
  });

  it("refuses a signature that isn't the account's", async () => {
    connect();
    // The same signature over another message recovers to someone else.
    signTypedDataAsync.mockResolvedValue(
      `0x${"11".repeat(32)}${fixture.signature.slice(66)}`
    );
    open(FRAGMENT);
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in your wallet" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      `This signature isn't from ${SHORT_ACCOUNT}. Your validator won't take it.`
    );
    expect(
      screen.queryByRole("heading", { name: "Copy the signature" })
    ).not.toBeInTheDocument();
  });
});
