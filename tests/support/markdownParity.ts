import { expect, type Locator, type Page } from "@playwright/test";

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
    text: '```ts\nconst greeting = "hello";\nconsole.log(greeting);\n```\n\n```unknown-language\n@literal :gm: https://example.invalid/code\n```',
    selectors: ["pre code.hljs"],
  },
  {
    name: "table",
    text: "| Name | Status |\n| :--- | ---: |\n| Alice | **Ready** |\n| Bob | Waiting |\n\nParagraph one\n\n\nParagraph two\n\nA note[^1].\n\n[^1]: Footnote text.",
    selectors: [
      "table",
      "th",
      "td",
      "a[data-footnote-ref]",
      "section[data-footnotes]",
    ],
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
  for (const selector of selectors) {
    await expect(body.locator(selector).first()).toBeVisible();
  }
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
      }))
  );
}
