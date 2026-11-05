"use client";

import { useEffect } from "react";

// A section of a page: #send-feedback, #known-issues.
const SECTION = /^#[a-z0-9-]{1,64}$/;

/**
 * Keeps a link's section through the password. The validator's own screens
 * link /validator#send-feedback. The browser never sends the fragment, so
 * the form posts to the unlock address with it, and the browser keeps it
 * over the redirect back to the page.
 */
export default function ValidatorUnlockSection({
  formId,
  action,
}: {
  readonly formId: string;
  readonly action: string;
}) {
  useEffect(() => {
    const form = document.getElementById(formId);
    const section = globalThis.location.hash;
    if (form instanceof HTMLFormElement && SECTION.test(section)) {
      form.setAttribute("action", `${action}${section}`);
    }
  }, [formId, action]);
  return null;
}
