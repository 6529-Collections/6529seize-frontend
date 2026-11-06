import { expect, test } from "@playwright/test";
import { TypedDataEncoder } from "ethers";
import { grantFixture } from "../../__tests__/lib/validator-page/grantFixture";
import { installLocalMuseumAppKitConfig } from "../support/localMuseumAppKitConfig";
import {
  installScriptedWallet,
  ScriptedWalletKey,
  SCRIPTED_WALLET_NAME,
} from "../support/scriptedWallet";
import {
  CONSENT_EULA_COOKIE,
  CURRENT_EULA_VERSION,
} from "../../constants/constants";

test("exports no data, blocks the wrong wallet, and signs only the reviewed grant", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  if (
    !baseURL ||
    !["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)
  ) {
    throw new Error(
      "Validator signing acceptance must run on a local sandbox."
    );
  }
  const key = ScriptedWalletKey.random();
  const wallet = await installScriptedWallet(context, key);
  await installLocalMuseumAppKitConfig(page, baseURL);
  await context.addCookies([
    { name: CONSENT_EULA_COOKIE, value: CURRENT_EULA_VERSION, url: baseURL },
  ]);
  const writes: string[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method()) &&
      new URL(request.url()).hostname === "127.0.0.1"
    )
      writes.push(request.url());
  });
  await page.goto("/validator/sign");
  await expect(
    page.getByRole("heading", { name: "Sign your validator authorization" })
  ).toBeVisible();
  // The shared shell switches from its SSR layout to the phone layout after
  // hydration. Wait for that real readiness signal before native details clicks.
  const shell = page.getByRole("main").first().locator("..");
  await expect(shell).toHaveAttribute("data-sidebar-ready", "true");
  await expect(shell).toHaveAttribute(
    "data-small",
    String(testInfo.project.use.isMobile === true)
  );
  await page.getByText("How do I get grant.json?", { exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Save the authorization message" })
  ).toBeVisible();
  await expect(
    page.getByText(/Keep the Validator app on that authorization screen/)
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("export-guide.png"),
    fullPage: true,
  });
  await page.getByLabel("Choose grant.json").setInputFiles({
    name: "grant.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(grantFixture())),
  });
  const review = page.getByRole("region", {
    name: "2. Check the wallet and validator keys",
  });
  await review
    .getByRole("button", { name: "Connect wallet", exact: true })
    .click();
  await page.getByText(SCRIPTED_WALLET_NAME, { exact: true }).click();
  await expect(review.getByRole("alert")).toContainText("does not match");
  await review.getByRole("checkbox").check();
  await expect(
    review.getByRole("button", { name: "Sign authorization", exact: true })
  ).toBeDisabled();
  expect(wallet.count("eth_signTypedData_v4")).toBe(0);
  expect(wallet.count("personal_sign")).toBe(0);

  await review.getByRole("button", { name: "Use a different message" }).click();
  const grant = grantFixture();
  grant.message.account = key.address;
  await page.getByLabel("Choose grant.json").setInputFiles({
    name: "grant.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(grant)),
  });
  await expect(
    review.getByText("Connected wallet address matches this authorization.")
  ).toBeVisible();
  await review.getByRole("checkbox").check();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 1
  );
  expect(overflow).toBe(false);
  await page.screenshot({
    path: testInfo.outputPath("review.png"),
    fullPage: true,
  });
  await review
    .getByRole("button", { name: "Sign authorization", exact: true })
    .click();
  await expect(page.getByLabel("Signature", { exact: true })).toHaveValue(
    /^0x[0-9a-fA-F]{130}$/
  );
  expect(wallet.typedDataSignatures("ValidatorGrant")).toHaveLength(1);
  expect(wallet.count("personal_sign")).toBe(0);
  // Wallet serialization lowercases addresses and encodes small integers as
  // numbers. The EIP-712 digest must still equal the original file's digest.
  const types = Object.fromEntries(
    Object.entries(grant.types).filter(([name]) => name !== "EIP712Domain")
  );
  const signedMessage =
    wallet.typedDataSignatures("ValidatorGrant")[0]?.message;
  expect(signedMessage).toBeDefined();
  expect(TypedDataEncoder.hash(grant.domain, types, signedMessage!)).toBe(
    TypedDataEncoder.hash(grant.domain, types, grant.message)
  );
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("signature-ready.png"),
    fullPage: true,
  });
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download signature" }).click();
  expect((await downloadEvent).suggestedFilename()).toBe(
    "validator-signature.txt"
  );
});
