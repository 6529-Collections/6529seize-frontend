import { expect, test } from "../testHelpers";
import {
  MARKDOWN_PARITY_CASES,
  markdownSnapshot,
  markdownBody,
  revealNewestMessage,
} from "../support/markdownParity";
import {
  closeE2eeUsers,
  openE2eeUser,
  resetE2eeSandbox,
  type E2eeUserSession,
} from "../support/e2ee/e2eeSandboxSession";
import {
  composer,
  enroll,
  gotoPath,
  messageRow,
  openConversationFromList,
  openMessageActions,
  startChat,
} from "../support/e2ee/e2eeUi";

test.describe("Encrypted Markdown @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 300_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1",
    "Requires the local encrypted sandbox."
  );
  let sessions: E2eeUserSession[] = [];
  test.afterEach(async () => {
    await closeE2eeUsers(sessions);
    sessions = [];
  });

  test("renders, receives, edits and reloads Markdown without fetching private URLs", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];
    const requests: string[] = [];
    for (const session of sessions) {
      session.page.on("request", (request) => {
        if (request.url().includes("markdown-private-canary"))
          requests.push(request.url());
      });
      await session.context.route("**/*markdown-private-canary*", (route) =>
        route.abort()
      );
      await enroll(session);
    }
    const g = await startChat(alice, ["bob"]);
    await openConversationFromList(bob.page, "alice");
    for (const sample of MARKDOWN_PARITY_CASES) {
      const marker = `Markdown ${sample.name}`;
      await composer(alice.page).fill(`${marker}\n\n${sample.text}`);
      await alice.page
        .getByRole("button", { name: "Send", exact: true })
        .click();
      const sent = messageRow(alice.page, marker);
      const received = messageRow(bob.page, marker);
      await revealNewestMessage(alice.page, sent);
      await revealNewestMessage(bob.page, received);
      const sender = await markdownSnapshot(
        markdownBody(sent, marker),
        sample.selectors
      );
      expect(
        await markdownSnapshot(markdownBody(received, marker), sample.selectors)
      ).toEqual(sender);
      await testInfo.attach(`encrypted-${sample.name}`, {
        body: await sent.screenshot(),
        contentType: "image/png",
      });
    }
    const privateText =
      'Private links\n\n[Named link](https://markdown-private-canary.invalid/named)\n\nhttps://markdown-private-canary.invalid/plain\n\n![Private image](https://markdown-private-canary.invalid/image.png)\n\n<img src="https://markdown-private-canary.invalid/html.png">\n\n[Unsafe script](javascript:alert%281%29)\n\n[Unsafe data](data:text/html,private)';
    await composer(alice.page).fill(privateText);
    await alice.page.getByRole("button", { name: "Send", exact: true }).click();
    const privateRow = messageRow(bob.page, "Private links");
    await revealNewestMessage(bob.page, privateRow);
    await expect(
      privateRow.getByRole("link", { name: "Private image" })
    ).toBeVisible({ timeout: 75_000 });
    expect(
      await privateRow.evaluate(
        (element) =>
          element.querySelector(
            "img[src*='markdown-private-canary'],iframe,video,audio"
          ) !== null
      )
    ).toBe(false);
    await expect(
      privateRow.getByRole("link", { name: /Unsafe script|Unsafe data/ })
    ).toHaveCount(0);
    await privateRow.getByRole("link", { name: "Named link" }).hover();
    await privateRow.getByRole("link", { name: "Named link" }).focus();
    const editRow = messageRow(alice.page, "Markdown formatting");
    await openMessageActions(alice.page, editRow);
    await alice.page.getByRole("menuitem", { name: "Edit" }).click();
    await composer(alice.page).fill(
      "Markdown edited\n\n**Updated bold** and `updated code`"
    );
    await alice.page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      messageRow(bob.page, "Markdown edited").getByText("Updated bold", {
        exact: true,
      })
    ).toHaveJSProperty("tagName", "STRONG", { timeout: 75_000 });
    await gotoPath(bob.page, `/messages/encrypted/${g}`);
    await expect(
      messageRow(bob.page, "Markdown edited").getByText("Updated bold", {
        exact: true,
      })
    ).toHaveJSProperty("tagName", "STRONG");
    await expect(
      messageRow(bob.page, "Private links").getByRole("link", {
        name: "Private image",
      })
    ).toBeVisible();
    expect(requests).toEqual([]);
    const width = await bob.page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(width.content).toBeLessThanOrEqual(width.viewport);
  });
});
