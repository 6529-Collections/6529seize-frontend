import {
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

export const CONVERSATION_PREVIEW_MARKDOWN =
  "**Bold** *italic* [Link](https://markdown-private-canary.invalid/preview)\n\n```js\nconsole.log('hi gelato3');\n```\n\n- first\n- second\n\n![Photo](https://markdown-private-canary.invalid/photo.png)";

/** Both the inbox and desktop sidebar must keep previews readable on one line. */
export async function checkConversationPreviews(
  page: Page,
  testInfo: TestInfo
) {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(new URL("/messages/encrypted", page.url()).href, {
      waitUntil: "domcontentloaded",
    });
    const rows = page
      .getByRole("list", { name: "Encrypted chats", exact: true })
      .getByRole("link")
      .filter({ hasText: "console.log('hi gelato3');" });
    await expect(rows.first()).toBeVisible({ timeout: 75_000 });
    const count = await rows.count();
    expect(count).toBe(width === 1440 ? 2 : 1);
    for (let index = 0; index < count; index += 1) {
      const row = rows.nth(index);
      await expect(row.getByText("Bold", { exact: true })).toHaveJSProperty(
        "tagName",
        "STRONG"
      );
      await expect(row.getByText("italic", { exact: true })).toHaveJSProperty(
        "tagName",
        "EM"
      );
      await expect(row).toContainText(
        "Link console.log('hi gelato3'); first second Photo"
      );
      await expect(row).not.toContainText("```");
      await expect(
        row
          .getByText("console.log('hi gelato3');", { exact: true })
          .locator("..")
          .locator("a, img, pre, p, ul, input")
      ).toHaveCount(0);
      const geometry = await row
        .getByText("console.log('hi gelato3');", { exact: true })
        .evaluate((code) => {
          const preview = code.parentElement!;
          const bounds = preview.getBoundingClientRect();
          return {
            height: bounds.height,
            right: bounds.right,
            font: getComputedStyle(code).fontFamily,
          };
        });
      expect(geometry.height).toBeLessThanOrEqual(24);
      expect(geometry.right).toBeLessThanOrEqual(width);
      expect(geometry.font).toContain("monospace");
      await testInfo.attach(`conversation-preview-${width}-${index}`, {
        body: await row.screenshot(),
        contentType: "image/png",
      });
    }
  }
}

/** Identical author input for ordinary and encrypted chat, including edit/reload. */
export const MARKDOWN_PARITY_CASES = [
  {
    name: "formatting",
    text: "# Heading one\n\n## Heading two\n\n### Heading three\n\n#### Heading four\n\n##### Heading five\n\n###### Heading six\n\n**Bold** *italic* ~~struck~~ and `inline code` with 😀.\n\nEscaped \\*literal\\*.",
    selectors: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "strong",
      "em",
      "del",
      "code",
    ],
  },
  {
    name: "lists",
    text: "> Quoted **bold** text\n\n- First item\n  - Nested item\n- Last item\n\n3) Third item\n4) Fourth item\n\n- [x] Finished\n- [ ] Pending\n\n---",
    selectors: [
      "blockquote",
      "ul ul",
      "ol[start='3']",
      "input:checked",
      "input:not(:checked)",
      "hr",
    ],
  },
  {
    name: "code",
    text: '```ts\nconst greeting = "hello";\n\n\nconsole.log(greeting);\n```\n\n```unknown-language\n@literal :gm: https://example.invalid/code\n```',
    selectors: ["pre code.hljs"],
  },
  {
    name: "table",
    text: "| Name | Status |\n| :--- | ---: |\n| Alice | **Ready** |\n| Bob | Waiting |\n\nParagraph one\n\n\nParagraph two",
    selectors: ["table", "th", "td"],
  },
] as const;

export function markdownBody(row: Locator, marker: string) {
  return row
    .getByText(marker, { exact: true })
    .locator("xpath=ancestor-or-self::p[1]/parent::*");
}

/** Capturing tall messages can scroll away from the live end of the timeline. */
export async function revealNewestMessage(page: Page, row: Locator) {
  const newest = page.getByRole("button", {
    name: "New messages",
    exact: true,
  });
  await expect(row.or(newest).first()).toBeVisible({ timeout: 75_000 });
  if (await newest.isVisible()) await newest.click();
  await expect(row).toBeVisible({ timeout: 75_000 });
}

export async function markdownSnapshot(
  body: Locator,
  selectors: readonly string[]
) {
  await expect
    .poll(() =>
      body.evaluate(
        (element, expected) =>
          expected.filter((selector) => {
            const node = element.querySelector(selector);
            return !node || node.getBoundingClientRect().height === 0;
          }),
        selectors
      )
    )
    .toEqual([]);
  return body.evaluate((element) =>
    Array.from(
      element.querySelectorAll(
        "h1,h2,h3,h4,h5,h6,p,strong,em,del,blockquote,ul,ol,li,pre,code,table,th,td,hr,input"
      )
    )
      .filter((node) => !node.closest("section[data-footnotes]"))
      .map((node) => ({
        tag: node.tagName.toLowerCase(),
        text: node.textContent?.replaceAll(/\s+/g, " ").trim(),
        start: node.getAttribute("start"),
        checked: node instanceof HTMLInputElement ? node.checked : null,
        listStyle:
          node instanceof HTMLUListElement
            ? getComputedStyle(node).listStyleType
            : null,
        codeFontSize:
          node.tagName === "PRE" ? getComputedStyle(node).fontSize : null,
      }))
  );
}
