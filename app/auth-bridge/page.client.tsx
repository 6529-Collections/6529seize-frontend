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
 * Redirect targets are validated against an exact-URI allowlist to prevent
 * open redirect attacks. Because Arweave is a public content gateway where
 * anyone can host arbitrary pages, we match exact redirect URIs (not whole
 * origins) to ensure only approved application endpoints receive the JWT.
 *
 * The allowlist is populated from the NEXT_PUBLIC_AUTH_BRIDGE_ALLOWLIST
 * environment variable — a comma-separated list of exact callback URIs.
 * This lets the team add/remove community apps without a code change.
 *
 * Example .env:
 *   NEXT_PUBLIC_AUTH_BRIDGE_ALLOWLIST=https://arweave.net/XXXX,https://myapp.com/auth/callback
 */

// Parse the allowlist from the public env var at module load time.
// Comma-separated, trimmed, empty entries skipped.
const AUTH_BRIDGE_ALLOWED_REDIRECT_URIS = new Set<string>(
  (process.env.NEXT_PUBLIC_AUTH_BRIDGE_ALLOWLIST ?? "")
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean)
);

function isAllowedRedirect(target: string): boolean {
  try {
    const url = new URL(target);
    // Reject if the target has a query string or fragment
    // (the fragment will be appended by us with the token)
    if (url.search !== "" || url.hash !== "") {
      return false;
    }
    // Exact URI match only — no origin-level wildcards
    return AUTH_BRIDGE_ALLOWED_REDIRECT_URIS.has(url.toString());
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

    if (AUTH_BRIDGE_ALLOWED_REDIRECT_URIS.size === 0) {
      setStatus("error");
      setMessage(
        "Auth bridge is not configured. Set NEXT_PUBLIC_AUTH_BRIDGE_ALLOWLIST to enable community app authentication."
      );
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
      const redirectTimer = window.setTimeout(() => {
        window.location.href = "/";
      }, 3000);
      return () => window.clearTimeout(redirectTimer);
    }

    // Redirect back to the requesting app with token in the URL fragment
    const redirectUrl = `${redirectTarget}#t=${encodeURIComponent(jwt)}`;

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