"use client";

import { useEffect, useRef, useState } from "react";
import { publicEnv } from "@/config/env";
import { getDecentralizedMediaFetchUrls } from "@/lib/media/decentralized-media";

export interface VerifiedImageDerivative {
  readonly width: number;
  readonly height: number;
  readonly cid: string;
  /** Lower-case hex SHA-256 the bytes must have. */
  readonly sha256: string;
  readonly byteSize: number;
}

export interface VerifiedImageCopy {
  readonly checking: string;
  readonly failed: string;
  readonly unavailable: string;
  readonly retry: string;
}

type State =
  | { readonly kind: "waiting" }
  | { readonly kind: "checking" }
  | { readonly kind: "verified"; readonly url: string }
  | { readonly kind: "failed" }
  | { readonly kind: "unavailable" };

const FETCH_TIMEOUT_MS = 20_000;

/** The smallest derivative at least as wide as the rendered width needs. */
function pickDerivative(
  derivatives: readonly VerifiedImageDerivative[],
  cssWidth: number,
  pixelRatio: number
): VerifiedImageDerivative | undefined {
  const needed = cssWidth * pixelRatio;
  return (
    derivatives.find((derivative) => derivative.width >= needed) ??
    derivatives.at(-1)
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

/**
 * Fetches the bytes by CID and returns them only if their SHA-256 is the one
 * recorded in the chain-verified catalog. Any gateway that serves other
 * bytes is skipped.
 */
async function fetchVerified(
  derivative: VerifiedImageDerivative,
  signal: AbortSignal
): Promise<Blob | "mismatch" | "unavailable"> {
  const urls = getDecentralizedMediaFetchUrls(`ipfs://${derivative.cid}`, {
    resolverEndpoint: publicEnv.MEDIA_RESOLVER_ENDPOINT,
    includeExternalFallbacks: true,
  });
  let sawMismatch = false;
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.any([
          signal,
          AbortSignal.timeout(FETCH_TIMEOUT_MS),
        ]),
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      const digest = toHex(await crypto.subtle.digest("SHA-256", buffer));
      if (
        buffer.byteLength === derivative.byteSize &&
        digest === derivative.sha256
      ) {
        return new Blob([buffer], { type: "image/webp" });
      }
      sawMismatch = true;
    } catch (error) {
      if (signal.aborted) throw error;
    }
  }
  return sawMismatch ? "mismatch" : "unavailable";
}

function statusText(state: State, copy: VerifiedImageCopy): string {
  if (state.kind === "failed") return copy.failed;
  if (state.kind === "unavailable") return copy.unavailable;
  return copy.checking;
}

/**
 * An image shown only after the browser has checked its bytes against the
 * SHA-256 anchored on-chain. Until then, and if the check fails, the frame
 * keeps the image's proportions and says what is happening.
 */
export function VerifiedImage({
  derivatives,
  alt,
  copy,
  eager = false,
  fit = "natural",
}: Readonly<{
  derivatives: readonly VerifiedImageDerivative[];
  alt: string;
  copy: VerifiedImageCopy;
  eager?: boolean;
  /** `square` letterboxes the image in a square frame, as in a grid. */
  fit?: "natural" | "square";
}>) {
  const frame = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>({ kind: "waiting" });
  const [attempt, setAttempt] = useState(0);
  const largest = derivatives.at(-1);
  const aspectRatio =
    fit === "square" || largest === undefined
      ? 1
      : largest.width / largest.height;

  useEffect(() => {
    const element = frame.current;
    if (element === null) return undefined;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    const start = () => {
      const derivative = pickDerivative(
        derivatives,
        element.clientWidth || 640,
        window.devicePixelRatio || 1
      );
      if (derivative === undefined) {
        setState({ kind: "unavailable" });
        return;
      }
      setState({ kind: "checking" });
      fetchVerified(derivative, controller.signal)
        .then((result) => {
          if (result instanceof Blob) {
            objectUrl = URL.createObjectURL(result);
            setState({ kind: "verified", url: objectUrl });
          } else {
            setState({
              kind: result === "mismatch" ? "failed" : "unavailable",
            });
          }
        })
        .catch(() => undefined);
    };
    let observer: IntersectionObserver | null = null;
    if (eager || typeof IntersectionObserver === "undefined") {
      start();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            start();
          }
        },
        { rootMargin: "400px" }
      );
      observer.observe(element);
    }
    return () => {
      observer?.disconnect();
      controller.abort();
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
    };
  }, [derivatives, eager, attempt]);

  return (
    <div
      ref={frame}
      className="tw-relative tw-w-full tw-overflow-hidden tw-bg-iron-950"
      style={{ aspectRatio }}
    >
      {state.kind === "verified" ? (
        // A verified blob URL: next/image cannot load object URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.url}
          alt={alt}
          className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-object-contain"
        />
      ) : (
        <div
          role="status"
          className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-p-3 tw-text-center tw-text-xs tw-leading-5 tw-text-iron-300 sm:tw-text-sm sm:tw-leading-6"
        >
          <span>{statusText(state, copy)}</span>
          {state.kind === "failed" || state.kind === "unavailable" ? (
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="tw-min-h-11 tw-rounded-md tw-border tw-border-solid tw-border-iron-600 tw-bg-transparent tw-px-4 tw-text-sm tw-text-iron-100 hover:tw-border-primary-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
            >
              {copy.retry}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
