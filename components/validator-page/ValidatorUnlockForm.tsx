"use client";

import type { FormEvent, ReactNode } from "react";

// A section of a page: #send-feedback, #known-issues.
const SECTION = /^#[a-z0-9-]{1,64}$/;

/**
 * The password form. It keeps a link's section through the password: the
 * validator's own screens link /validator#send-feedback, and the browser
 * never sends the fragment. On submit the form posts to the unlock address
 * with the section, and the browser keeps it over the redirect back to the
 * page. Without scripts the form posts to the unlock address alone.
 */
export default function ValidatorUnlockForm({
  id,
  action,
  className,
  children,
}: {
  readonly id: string;
  readonly action: string;
  readonly className: string;
  readonly children: ReactNode;
}) {
  const keepSection = (event: FormEvent<HTMLFormElement>) => {
    const section = globalThis.location.hash;
    if (SECTION.test(section)) {
      event.currentTarget.setAttribute("action", `${action}${section}`);
    }
  };
  return (
    <form
      id={id}
      method="post"
      action={action}
      onSubmit={keepSection}
      className={className}
    >
      {children}
    </form>
  );
}
