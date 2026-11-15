import { privateKeyToAccount } from "viem/accounts";
import { toHex } from "viem";

import { expect, test } from "../testHelpers";
import {
  buildWalletRequestFragment,
  encodeWalletRequestEnvelope,
  WALLET_REQUEST_TTL_MS,
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
});
