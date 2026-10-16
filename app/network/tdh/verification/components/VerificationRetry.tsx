"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { TDH_BUTTON } from "../../shared/tdhStyles";

/** Re-renders the page on the server, refetching the verification files. */
export default function VerificationRetry({
  label,
}: {
  readonly label: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className={TDH_BUTTON}
    >
      <ArrowPathIcon
        aria-hidden="true"
        className={`tw-size-4 ${pending ? "tw-animate-spin motion-reduce:tw-animate-none" : ""}`}
      />
      {label}
    </button>
  );
}
