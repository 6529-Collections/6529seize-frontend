import { privateKeyToAccount } from "viem/accounts";
import {
  encodeFunctionData,
  type Hex,
  numberToHex,
  parseAbiItem,
  toHex,
} from "viem";

import { expect, test } from "../testHelpers";
import {
  buildWalletRequestFragment,
  encodeWalletRequestEnvelope,
  WALLET_REQUEST_TTL_MS,
  WALLET_TRANSACTION_TTL_MS,
  walletRequestCode,
} from "../../lib/desktop/wallet-forwarding";
import { WALLET_MESSAGE_TTL_MS } from "../../lib/desktop/walletMessageTtl";

// 6529 Desktop's browser page for a forwarded wallet request: a request the
// shell signed opens in the system browser at the app's local origin. The
// browser-specific risks covered here: the fragment leaves the address bar
// before anything loads, the envelope signature verifies with the browser's
// own crypto, and nothing is offered to sign without a valid shell
// signature. No wallet is connected and nothing is signed.

// Public development keys (Hardhat/Anvil accounts 0 and 1); never funded.
const shell = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);
const stranger = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);
const ADDRESS = "0x1111111111111111111111111111111111111111";
const ID = "Q".repeat(43);
const SIGNER_ROUTE = "**/browser-connector/signer";
const LOCAL_ORIGIN = /^http:\/\/localhost:\d{1,5}$/;

/** A structured drop signature, as the app builds it at this origin. */
function dropMessage(origin: string): string {
  const issuedAt = new Date();
  return [
    "6529 Action",
    "Version: 2",
    "Audience: api.6529.io",
    `Domain: ${new URL(origin).host}`,
    `Client Origin: ${origin}`,
    `Wallet: ${ADDRESS}`,
    "Chain ID: 1",
    `Issued At: ${issuedAt.toISOString()}`,
    `Expiration Time: ${new Date(issuedAt.getTime() + WALLET_MESSAGE_TTL_MS).toISOString()}`,
    "Nonce: 00000000-0000-4000-8000-000000000001",
    "Action: create_drop",
    `Payload Hash: ${"ab".repeat(32)}`,
    "Purpose: Sign this message to create a 6529 drop.",
  ].join("\n");
}

async function signedFragment(
  origin: string,
  message: string,
  envelopeOrigin = origin
) {
  const now = Date.now();
  const bytes = encodeWalletRequestEnvelope({
    v: 1,
    id: ID,
    scheme: "localcore6529",
    origin: envelopeOrigin,
    issuedAt: now,
    expiresAt: now + WALLET_REQUEST_TTL_MS,
    request: {
      method: "personal_sign",
      params: [toHex(message), ADDRESS],
      address: ADDRESS,
      chainId: 1,
    },
  });
  const fragment = buildWalletRequestFragment(
    bytes,
    await shell.signMessage({ message: { raw: bytes } })
  );
  if (fragment === null) throw new Error("fragment too large");
  return fragment;
}

/** The subscriptions top-up address (on the transaction allow-list). */
const SUBSCRIPTIONS = "0xcaac2b43b1b40edbfaddb5aebde9a90a27e1a3be";
/** The Memes contract (ERC-1155 transfers are on the allow-list). */
const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
/** A placeholder transfer recipient. */
const RECIPIENT = "0xab5801a7d398351b8be11c439e05c5b3259aec9b";
/** A pinned 6529 Provenance test registry (Sepolia). */
const PROVENANCE_REGISTRY = "0x0e289576c7565d29018134517309668946ffc912";

/**
 * A shell-signed transaction request: `value` wei to `to` with call data
 * `data` (a plain send by default) on `chainId`.
 */
async function signedTransactionFragment(
  origin: string,
  to: string,
  value: bigint,
  data: Hex = "0x",
  chainId = 1
) {
  const now = Date.now();
  const bytes = encodeWalletRequestEnvelope({
    v: 1,
    id: ID,
    scheme: "localcore6529",
    origin,
    issuedAt: now,
    expiresAt: now + WALLET_TRANSACTION_TTL_MS,
    request: {
      method: "eth_sendTransaction",
      params: [{ from: ADDRESS, to, data, value: numberToHex(value) }],
      address: ADDRESS,
      chainId,
    },
  });
  const fragment = buildWalletRequestFragment(
    bytes,
    await shell.signMessage({ message: { raw: bytes } })
  );
  if (fragment === null) throw new Error("fragment too large");
  return fragment;
}

test.describe("Desktop wallet request page", () => {
  test.beforeEach(({ baseURL }) => {
    // The page accepts only 6529 Desktop's local origin.
    test.skip(
      !baseURL || !LOCAL_ORIGIN.test(new URL(baseURL).origin),
      "Runs only against a local server (http://localhost:<port>)."
    );
  });

  test("shows a shell-signed request and removes it from the address bar", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const message = dropMessage(origin);
    await page.route(SIGNER_ROUTE, (route) =>
      route.fulfill({ json: { signer: shell.address } })
    );

    await page.goto(
      `/browser-connector${await signedFragment(origin, message)}`
    );

    await expect(
      page.getByRole("heading", { name: "Sign for 6529 Desktop" })
    ).toBeVisible();
    await expect(page.getByText(walletRequestCode(ID))).toBeVisible();
    await expect(page.getByText(/Create a 6529 drop/)).toBeVisible();
    await expect(page.getByRole("main").locator("pre")).toHaveText(message);
    await expect.poll(() => new URL(page.url()).hash).toBe("");
    // No wallet is connected: the page asks for one and offers no Sign.
    await expect(
      page.getByRole("button", { name: "Connect wallet" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign in wallet" })
    ).toHaveCount(0);
  });

  test("offers nothing to sign when another key signed the request", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    await page.route(SIGNER_ROUTE, (route) =>
      route.fulfill({ json: { signer: stranger.address } })
    );

    await page.goto(
      `/browser-connector${await signedFragment(origin, dropMessage(origin))}`
    );

    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "did not get a valid request"
    );
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).hash).toBe("");
  });

  test("offers nothing to sign for a request made for another origin", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    const port = Number(new URL(origin).port || "80");
    const otherOrigin = `http://localhost:${port === 65535 ? port - 1 : port + 1}`;
    await page.route(SIGNER_ROUTE, (route) =>
      route.fulfill({ json: { signer: shell.address } })
    );

    await page.goto(
      `/browser-connector${await signedFragment(
        origin,
        dropMessage(origin),
        otherOrigin
      )}`
    );

    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "did not get a valid request"
    );
    await expect(page.getByRole("main").getByRole("button")).toHaveCount(0);
    await expect.poll(() => new URL(page.url()).hash).toBe("");
  });

  test("shows an allow-listed transaction decoded from the signed request", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    await page.route(SIGNER_ROUTE, (route) =>
      route.fulfill({ json: { signer: shell.address } })
    );

    await page.goto(
      `/browser-connector${await signedTransactionFragment(
        origin,
        SUBSCRIPTIONS,
        65_290_000_000_000_000n
      )}`
    );

    const main = page.getByRole("main");
    await expect(
      main.getByText("Top up your Memes subscription balance")
    ).toBeVisible();
    await expect(main.getByText(/6529 subscriptions wallet/)).toBeVisible();
    await expect(
      main.getByRole("link", {
        name: "0xCaAc2b43b1b40eDBFAdDB5aebde9A90a27E1A3be",
      })
    ).toBeVisible();
    await expect(main.getByText(/^0\.06529 ETH/)).toBeVisible();
    await expect.poll(() => new URL(page.url()).hash).toBe("");
    // No wallet is connected: the page asks for one and offers no Send.
    await expect(
      main.getByRole("button", { name: "Connect wallet" })
    ).toBeVisible();
    await expect(
      main.getByRole("button", { name: "Send in wallet" })
    ).toHaveCount(0);
  });

  test("shows an NFT transfer's recipient in full with its confirmation", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    await page.route(SIGNER_ROUTE, (route) =>
      route.fulfill({ json: { signer: shell.address } })
    );
    // The recipient's 6529 profile, as 6529's profile data would answer.
    await page.route(`**/api/identities/${RECIPIENT}`, (route) =>
      route.fulfill({ json: { handle: "transferTarget" } })
    );

    await page.goto(
      `/browser-connector${await signedTransactionFragment(
        origin,
        MEMES,
        0n,
        encodeFunctionData({
          abi: [
            parseAbiItem(
              "function safeBatchTransferFrom(address from,address to,uint256[] ids,uint256[] amounts,bytes data)"
            ),
          ],
          args: [ADDRESS, RECIPIENT, [412n], [1n], "0x"],
        })
      )}`
    );

    const main = page.getByRole("main");
    await expect(main.getByText("Transfer several NFTs")).toBeVisible();
    const recipient = main.getByLabel(
      "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"
    );
    await expect(recipient).toBeVisible();
    await expect(recipient.getByText("Ab58", { exact: true })).toBeVisible();
    await expect(main.getByText("6529 profile: transferTarget")).toBeVisible();
    await expect(main.getByText(/not part of the transaction/)).toBeVisible();
    await expect(
      main.getByRole("checkbox", {
        name: "I checked that this is the right recipient. Transfers cannot be undone.",
      })
    ).not.toBeChecked();
    await expect(
      main.getByRole("button", { name: "Send in wallet" })
    ).toHaveCount(0);
  });

  test("shows each record of a provenance publish", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    await page.route(SIGNER_ROUTE, (route) =>
      route.fulfill({ json: { signer: shell.address } })
    );
    const word = (byte: string) => `0x${byte.repeat(32)}` as Hex;

    await page.goto(
      `/browser-connector${await signedTransactionFragment(
        origin,
        PROVENANCE_REGISTRY,
        0n,
        encodeFunctionData({
          abi: [
            parseAbiItem(
              "function publish(uint32 releaseId,(bytes32 subjectId,bytes32 recordType,bytes32 schemaId,(uint16 algorithm,bytes32 digest,bytes32 canonicalizationId) contentHash,uint64 effectiveAt,bytes cid,bytes32 arweaveId,string label,uint32 expectedVersion)[] records)"
            ),
          ],
          args: [
            3,
            [
              {
                subjectId: word("a1"),
                recordType: word("b2"),
                schemaId: word("c3"),
                contentHash: {
                  algorithm: 2,
                  digest: word("11"),
                  canonicalizationId: word("22"),
                },
                effectiveAt: 1_795_000_000n,
                cid: `0x01551220${"ab".repeat(32)}`,
                arweaveId: word("00"),
                label: "",
                expectedVersion: 0,
              },
            ],
          ],
        }),
        11_155_111
      )}`
    );

    const main = page.getByRole("main");
    await expect(
      main.getByText("Publish records to 6529 Provenance")
    ).toBeVisible();
    await expect(main.getByText("Sepolia test network")).toBeVisible();
    await expect(main.getByText("Record 1")).toBeVisible();
    await expect(main.getByText(word("a1"))).toBeVisible();
    await expect(main.getByText("0 (a new subject)")).toBeVisible();
    await expect(
      main.getByRole("button", { name: "Send in wallet" })
    ).toHaveCount(0);
  });

  test("refuses a transaction outside the allow-list", async ({
    page,
    baseURL,
  }) => {
    const origin = new URL(baseURL!).origin;
    await page.route(SIGNER_ROUTE, (route) =>
      route.fulfill({ json: { signer: shell.address } })
    );

    await page.goto(
      `/browser-connector${await signedTransactionFragment(
        origin,
        stranger.address.toLowerCase(),
        1n
      )}`
    );

    await expect(page.getByRole("main").getByRole("alert")).toContainText(
      "will not ask your wallet to send this transaction"
    );
    await expect(
      page.getByRole("main").getByRole("button", { name: "Send in wallet" })
    ).toHaveCount(0);
  });
});
