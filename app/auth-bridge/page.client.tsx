"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthJwt } from "@/services/auth/auth.utils";

/**
 * Auth Bridge Page
 *
 * Enables community-built applications (e.g. AR apps on Arweave) to
 * authenticate 6529.io members with zero friction. If the user is already
 * logged into 6529.io, this page reads the existing JWT and redirects back
 * to the requesting app with the token in the URL fragment (#t=...).
 *
 * The token is placed in the fragment (not the query string) so it never
 * hits server logs — it is purely client-side.
 *
 * Redirect targets are validated against an allowlist to prevent open
 * redirect attacks. New community apps can be added to AUTH_BRIDGE_ALLOWLIST.
 */

// Allowlist of approved redirect targets.
// To add a new community app, add its origin here.
const AUTH_BRIDGE_ALLOWLIST: string[] = [
  "https://arweave.net",
  // Add more approved community app origins here
];

function isAllowedRedirect(target: string): boolean {
  try {
    const url = new URL(target);
    return AUTH_BRIDGE_ALLOWLIST.some(
      (allowed) => url.origin === allowed
    );
  } catch {
    return false;
  }
}

export default function AuthBridgePageClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "done">(
    "loading"
  );
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const redirectTarget = searchParams.get("r");

    if (!redirectTarget) {
      setStatus("error");
      setMessage("Missing redirect target.");
      return;
    }

    if (!isAllowedRedirect(redirectTarget)) {
      setStatus("error");
      setMessage(
        "This redirect target is not approved. Contact the 6529 team to add your app to the allowlist."
      );
      return;
    }

    const jwt = getAuthJwt();

    if (!jwt) {
      // Not logged in — redirect to 6529.io home / login
      setStatus("error");
      setMessage("You are not logged in. Please sign in to 6529.io first.");
      // Auto-redirect to home after 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
      return;
    }

    // Redirect back to the requesting app with token in the URL fragment
    const separator = redirectTarget.includes("#") ? "&" : "#";
    const redirectUrl = `${redirectTarget}${separator}t=${encodeURIComponent(jwt)}`;

    // Clear the fragment from the address bar after redirect
    window.location.replace(redirectUrl);
    setStatus("done");
  }, [searchParams]);

  if (status === "done") {
    return (
      <div className="tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-bg-black">
        <p className="tw-text-sm tw-text-neutral-400">
          Redirecting…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-bg-black">
        <div className="tw-text-center">
          <p className="tw-text-base tw-text-red-400">{message}</p>
          <p className="tw-mt-4">
            <a
              href="/"
              className="tw-text-sm tw-font-medium tw-text-emerald-400 hover:tw-underline"
            >
              Return to 6529.io
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-flex tw-min-h-screen tw-items-center tw-justify-center tw-bg-black">
      <p className="tw-text-sm tw-text-neutral-400">
        Authenticating…
      </p>
    </div>
  );
}