import type { Page } from "@playwright/test";
import { buildSync } from "esbuild";

// Bundle the real observer/click resolver; report locally, never to Mixpanel.
export async function installSectionTrackingFixture(
  page: Page,
  markup: string,
  setup: string
) {
  await page.setContent(`${markup}
    <ol aria-label="Sections seen"></ol>
    <ol aria-label="Actions clicked"></ol>
  `);
  const script = buildSync({
    stdin: {
      resolveDir: process.cwd(),
      contents: `
        const append = (label, text) => {
          const item = document.createElement('li');
          item.textContent = text;
          document.querySelector('ol[aria-label="' + label + '"]').append(item);
        };
        ${setup}
      `,
    },
    bundle: true,
    format: "iife",
    write: false,
  });
  await page.addScriptTag({ content: script.outputFiles[0]!.text });
  return {
    seen: page
      .getByRole("list", { name: "Sections seen" })
      .getByRole("listitem"),
    clicked: page
      .getByRole("list", { name: "Actions clicked" })
      .getByRole("listitem"),
  };
}
