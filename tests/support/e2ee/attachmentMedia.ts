import type { Download, Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Gallery clicks and downloads fail within this time, with a description of
 * the button, instead of hanging until the test's own (long) timeout.
 */
const GALLERY_ACTION_TIMEOUT_MS = 30_000;

export async function dropEncryptedAttachment(
  page: Page,
  file: {
    readonly name: string;
    readonly base64: string;
    readonly mimeType: string;
  }
) {
  const dataTransfer = await page.evaluateHandle(
    ({ name, base64, mimeType }) => {
      const transfer = new DataTransfer();
      const bytes = Uint8Array.from(
        atob(base64),
        (character) => character.codePointAt(0) ?? 0
      );
      transfer.items.add(new File([bytes], name, { type: mimeType }));
      return transfer;
    },
    file
  );
  try {
    const chat = page.getByRole("region", {
      name: "Encrypted chat file upload area",
    });
    await chat.dispatchEvent("dragenter", { dataTransfer });
    await expect(
      chat.getByText("Drop files here", { exact: true })
    ).toBeVisible();
    await chat.dispatchEvent("drop", { dataTransfer });
    await expect(
      chat.getByText("Drop files here", { exact: true })
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("list", { name: "Attachments" })
        .getByText(file.name, { exact: true })
    ).toBeVisible();
  } finally {
    await dataTransfer.dispose();
  }
}

/**
 * The button's state and the topmost element at its centre, for a click that
 * did not land or a download that did not start (no trace in staging packs).
 */
async function describeButton(button: Locator): Promise<string> {
  return await button
    .evaluate(
      (element) => {
        const describe = (node: Element | null) =>
          node === null
            ? "nothing"
            : `<${node.tagName.toLowerCase()}${node.getAttribute("aria-label") ? ` aria-label="${node.getAttribute("aria-label")}"` : ""} class="${(node.getAttribute("class") ?? "").slice(0, 160)}">`;
        const rect = element.getBoundingClientRect();
        const topmost = document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2
        );
        const covered =
          topmost !== null && topmost !== element && !element.contains(topmost);
        return `${describe(element)} disabled=${String((element as HTMLButtonElement).disabled)} at ${Math.round(rect.x)},${Math.round(rect.y)} ${Math.round(rect.width)}x${Math.round(rect.height)}; topmost at its centre: ${covered ? describe(topmost) : "the button itself"}`;
      },
      null,
      { timeout: 5_000 }
    )
    .catch(
      (error: unknown) => `could not inspect the button (${String(error)})`
    );
}

async function clickGalleryButton(button: Locator, label: string) {
  try {
    await button.click({ timeout: GALLERY_ACTION_TIMEOUT_MS });
  } catch (error) {
    throw new Error(
      `${label}: the click did not land. Button: ${await describeButton(button)}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

interface DownloadWatch {
  /** Starts the wait budget; call once the click has landed. */
  readonly arm: () => Promise<Download | null>;
  /** Stops watching, for a click that failed. */
  readonly cancel: () => void;
}

/**
 * Watches every page of the context, popups included, for the next download.
 * Listening starts at once so no event is missed; the time budget starts at
 * `arm`, after the click, so a slow click does not use it up.
 */
function watchNextDownload(page: Page): DownloadWatch {
  const context = page.context();
  const watched = new Set<Page>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settle: (download: Download | null) => void = () => undefined;
  const result = new Promise<Download | null>((resolve) => {
    settle = resolve;
  });
  const finish = (download: Download | null) => {
    clearTimeout(timer);
    context.off("page", watch);
    for (const watchedPage of watched) {
      watchedPage.off("download", finish);
    }
    settle(download);
  };
  function watch(candidate: Page) {
    if (watched.has(candidate)) return;
    watched.add(candidate);
    candidate.on("download", finish);
  }
  context.pages().forEach(watch);
  context.on("page", watch);
  return {
    arm: () => {
      timer = setTimeout(() => finish(null), GALLERY_ACTION_TIMEOUT_MS);
      return result;
    },
    cancel: () => finish(null),
  };
}

/** Clicks the preview's download button and checks the file that comes out. */
async function downloadFromPreview(
  preview: Locator,
  page: Page,
  filename: string
) {
  const button = preview.getByRole("button", {
    name: "Download media",
    exact: true,
  });
  const download = watchNextDownload(page);
  try {
    await clickGalleryButton(button, `Downloading ${filename}`);
  } catch (error) {
    download.cancel();
    throw error;
  }
  const started = await download.arm();
  if (!started) {
    throw new Error(
      `Downloading ${filename}: no page in the context started a download within ${GALLERY_ACTION_TIMEOUT_MS} ms of the click. Button: ${await describeButton(button)}`
    );
  }
  expect(started.suggestedFilename()).toBe(filename);
}

/** Runs in desktop and mobile-browser packs; the native save path has separate unit coverage. */
export async function checkEncryptedImageActions(
  page: Page,
  image: Locator,
  filename: string,
  nextFilename?: string
) {
  await expect(image).toBeVisible();
  const trigger = page.getByRole("button", {
    name: `Open image preview: ${filename}`,
    exact: true,
  });
  await clickGalleryButton(trigger, `Opening ${filename}`);
  const preview = page.getByRole("dialog", { name: "Expanded image preview" });
  await expect(preview.getByRole("img")).toBeVisible();
  await expect(preview.getByRole("img")).toHaveAttribute("src", /^blob:/u);
  if (nextFilename) {
    const firstSource = await preview.getByRole("img").getAttribute("src");
    const next = preview.getByRole("button", {
      name: "Next image",
      exact: true,
    });
    await expect(next).toBeEnabled();
    await clickGalleryButton(next, `Going to ${nextFilename}`);
    await expect(preview.getByRole("img")).not.toHaveAttribute(
      "src",
      firstSource ?? ""
    );
    await downloadFromPreview(preview, page, nextFilename);
    await clickGalleryButton(
      preview.getByRole("button", { name: "Previous image", exact: true }),
      `Going back to ${filename}`
    );
    await expect(preview.getByRole("img")).toHaveAttribute(
      "src",
      firstSource ?? ""
    );
  }
  await downloadFromPreview(preview, page, filename);
  await clickGalleryButton(
    preview.getByRole("button", { name: "Close media", exact: true }),
    `Closing ${filename}`
  );
  await expect(preview).toHaveCount(0);
  await clickGalleryButton(trigger, `Reopening ${filename}`);
  await page.keyboard.press("Escape");
  await expect(preview).toHaveCount(0);
  await expect(trigger).toBeFocused();
}
