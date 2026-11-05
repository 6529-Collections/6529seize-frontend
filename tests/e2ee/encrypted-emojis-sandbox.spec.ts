import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  e2eeSandboxControls,
  E2EE_SYNC_TIMEOUT_MS,
  openE2eeUser,
  resetE2eeSandbox,
  type E2eeUserSession,
} from "../support/e2ee/e2eeSandboxSession";
import {
  composer,
  enroll,
  expectMessage,
  messageRow,
  openConversationFromList,
  openMessageActions,
  startChat,
} from "../support/e2ee/e2eeUi";

// A synthetic 24px WebP; production emoji assets never enter the local sandbox.
const INLINE_EMOJI =
  "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAAAQAwCdASoYABgAPm0ylUekIyIhKAgAgA2JZQB2AACcyeAA/Mr//9NI/40j/jSPmLf/XwBTxIAAAA==";
async function installPack(context: BrowserContext, ready = Promise.resolve()) {
  await context.route("**/api/e2ee/emoji-pack", async (route) => {
    await ready;
    await route.fulfill({ json: [{ id: "gm", src: INLINE_EMOJI }] });
  });
}
async function chooseEmoji(page: Page, search: string, label: string) {
  const picker = page.getByRole("dialog").locator("em-emoji-picker");
  await expect(picker).toBeVisible();
  await picker.getByPlaceholder("Search", { exact: true }).fill(search);
  await picker.getByRole("button", { name: label, exact: true }).click();
  await expect(picker).toHaveCount(0);
}

test.describe("Encrypted emoji picker @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 300_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Requires the encrypted local sandbox."
  );
  let sessions: E2eeUserSession[] = [];
  let releaseCatalog: () => void = () => undefined;
  test.afterEach(async () => {
    releaseCatalog();
    await closeE2eeUsers(sessions);
    sessions = [];
  });

  test("inserts native and custom emojis, receives and edits them, and toggles custom reactions without asset leaks", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];
    const catalogReady = new Promise<void>((resolve) => {
      releaseCatalog = resolve;
    });
    await installPack(alice.context, catalogReady);
    await installPack(bob.context);
    const assets: string[] = [];
    for (const session of sessions)
      session.page.on("request", (request) => {
        if (
          request.url().includes("6529-emoji/") ||
          request.url().includes("/api/profile-cms/assets")
        )
          assets.push(request.url());
      });
    await enroll(alice);
    await enroll(bob);
    await startChat(alice, ["bob"]);
    // The development-only Next indicator overlaps the phone composer.
    // Page errors remain captured by the session diagnostics.
    await alice.page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    });
    const input = composer(alice.page);
    const emojiTrigger = alice.page.getByRole("button", { name: "Add emoji" });
    await expect(input).toHaveAttribute(
      "placeholder",
      "Write an encrypted message"
    );
    const inputBounds = await input.boundingBox();
    const emojiBounds = await emojiTrigger.boundingBox();
    expect(inputBounds).not.toBeNull();
    expect(emojiBounds).not.toBeNull();
    expect(emojiBounds!.x).toBeGreaterThanOrEqual(inputBounds!.x);
    expect(emojiBounds!.x + emojiBounds!.width).toBeLessThanOrEqual(
      inputBounds!.x + inputBounds!.width
    );
    expect(
      inputBounds!.height,
      "The empty composer stays on one line"
    ).toBeLessThan(60);
    await input.fill("Secret hello ");
    await emojiTrigger.focus();
    await emojiTrigger.press("Enter");
    await expect(
      alice.page.getByRole("dialog").locator("em-emoji-picker")
    ).toBeVisible();
    await expect(
      alice.page.getByRole("dialog", { name: "Choose an emoji" })
    ).toHaveCount(0);
    await alice.page.keyboard.press("Escape");
    await expect(emojiTrigger).toBeFocused();
    await emojiTrigger.press("Enter");
    await chooseEmoji(alice.page, "grinning", "😀");
    await expect(input).toHaveValue("Secret hello 😀");
    await expect(input).toBeFocused();
    // Native selection worked while the catalog request was still pending.
    releaseCatalog();
    await alice.page.getByRole("button", { name: "Add emoji" }).click();
    const picker = alice.page.getByRole("dialog").locator("em-emoji-picker");
    await expect(
      picker.getByRole("button", { name: "Frequently used", exact: true })
    ).toHaveCount(0);
    await expect(
      picker.getByRole("button", { name: "Flags", exact: true })
    ).toBeInViewport();
    expect(
      await alice.page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      )
    ).toBe(false);
    const clipped = await picker.evaluate((host) => {
      const scroll = host.shadowRoot!.querySelector(".scroll")!;
      const bounds = scroll.getBoundingClientRect();
      return [...scroll.querySelectorAll("button")].some(
        (button) => button.getBoundingClientRect().right > bounds.right + 1
      );
    });
    expect(clipped, "Every emoji column fits inside the picker").toBe(false);
    await alice.page.screenshot({
      path: testInfo.outputPath("encrypted-emoji-picker.png"),
      fullPage: true,
      animations: "disabled",
    });
    await chooseEmoji(alice.page, "gm", ":gm:");
    await expect(input).toHaveValue("Secret hello 😀:gm:");
    if (testInfo.project.use.isMobile) {
      await input.press("Enter");
      await expect(input).toHaveValue(/\n$/u);
      await alice.page
        .getByRole("button", { name: "Send", exact: true })
        .click();
    } else {
      await input.press("Enter");
    }
    const sent = messageRow(alice.page, "Secret hello 😀");
    if (testInfo.project.use.isMobile) {
      await expect(input).not.toBeFocused();
    }
    await expect(
      sent.getByRole("img", { name: ":gm:", exact: true })
    ).toBeVisible();
    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, "Secret hello 😀");
    const received = messageRow(bob.page, "Secret hello 😀");
    await expect(
      received.getByRole("img", { name: ":gm:", exact: true })
    ).toBeVisible();
    await openMessageActions(bob.page, received);
    await bob.page.getByRole("menuitem", { name: "More reactions" }).click();
    await chooseEmoji(bob.page, "gm", ":gm:");
    await expect(
      received.getByRole("button", { name: "Message actions" })
    ).toBeFocused();
    const reaction = received.getByRole("button", { name: /:gm:.*1/u });
    await expect(reaction).toHaveAttribute("aria-pressed", "true", {
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(sent.getByRole("button", { name: /:gm:.*1/u })).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await reaction.click();
    await expect(
      received.getByRole("button", { name: /:gm:.*1/u })
    ).toHaveCount(0);
    await openMessageActions(alice.page, sent);
    await alice.page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(input).toHaveValue("Secret hello 😀:gm:");
    await input.press("Escape");
    await expect(input).toHaveValue("");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("Secret hello 😀:gm:");
    await input.fill("Edited secret :gm: ");
    await alice.page.getByRole("button", { name: "Add emoji" }).click();
    await chooseEmoji(alice.page, "grinning", "😀");
    await expect(input).toHaveValue("Edited secret :gm: 😀");
    if (testInfo.project.use.isMobile) {
      await alice.page
        .getByRole("button", { name: "Save", exact: true })
        .click();
    } else {
      await input.press("Enter");
    }
    await expect(
      bob.page
        .getByRole("list", { name: "Messages", exact: true })
        .getByRole("listitem")
        .filter({ hasText: "Edited secret" })
        .getByRole("img", { name: ":gm:", exact: true })
    ).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
    expect(assets).toEqual([]);
    for (const session of sessions)
      expect(
        await session.page.evaluate(() =>
          localStorage.getItem("emoji-mart.frequently")
        )
      ).toBeNull();
    const scan = await e2eeSandboxControls.plaintextScan(baseURL, [
      "Secret hello",
      "Edited secret",
      ":gm:",
    ]);
    expect(scan.found).toEqual([]);
  });
});
