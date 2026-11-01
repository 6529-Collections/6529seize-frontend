import type { Breadcrumb } from "@sentry/nextjs";

/** Encrypted chats and their devices and new-chat pages. */
const ENCRYPTED_MESSAGES_PATH_PATTERN = /^\/messages\/encrypted(?:\/|$)/;

export const currentPathname = (): string | null => {
  try {
    return globalThis.location?.pathname ?? null;
  } catch {
    return null;
  }
};

/**
 * Click and input breadcrumbs describe the element by its aria-label, title
 * or alt text. On encrypted-chat pages those carry decrypted metadata, such
 * as attachment file names and chat names, so they are not recorded there.
 */
export function isEncryptedChatUiBreadcrumb(
  breadcrumb: Breadcrumb,
  pathname: string | null
): boolean {
  return (
    breadcrumb.category?.startsWith("ui.") === true &&
    pathname !== null &&
    ENCRYPTED_MESSAGES_PATH_PATTERN.test(pathname)
  );
}
