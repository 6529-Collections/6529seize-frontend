"use client";

/* Boolean URL state has one explicit three-way decode. */
/* eslint-disable no-nested-ternary, sonarjs/no-nested-conditional */

import Image from "next/image";
import {
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { SupportedLocale } from "@/i18n/locales";
import type {
  MuseumGenerativeStudy,
  MuseumHeldPosition,
  MuseumMintedProjectIndex,
  MuseumMintedToken,
} from "@/lib/museum/generative-studies";

export interface MuseumProjectSystemVisualProps {
  readonly study: MuseumGenerativeStudy;
  readonly locale: SupportedLocale;
  readonly mintedIndex: MuseumMintedProjectIndex;
  readonly selectedWorkId: string;
}

export type ComparisonMode = "minted" | "counterfactual";

export interface ProjectComparisonProps {
  readonly candidateMode: ComparisonMode;
  readonly candidateToken: MuseumMintedToken;
}

export const focusClass =
  "focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300";
export const smallControlClass = `tw-min-h-11 tw-rounded-md tw-border tw-border-solid tw-px-4 tw-text-sm tw-font-semibold tw-transition-colors motion-reduce:tw-transition-none ${focusClass}`;
const URL_STATE_EVENT = "museum:url-state";
const MODEL_STATE_VERSION = "1";

function subscribeToUrlState(onStoreChange: () => void): () => void {
  window.addEventListener("popstate", onStoreChange);
  window.addEventListener(URL_STATE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("popstate", onStoreChange);
    window.removeEventListener(URL_STATE_EVENT, onStoreChange);
  };
}

function getUrlSnapshot(): string {
  return window.location.href;
}

function getServerUrlSnapshot(): string {
  return "";
}

export function useUrlSnapshot(): string {
  return useSyncExternalStore(
    subscribeToUrlState,
    getUrlSnapshot,
    getServerUrlSnapshot
  );
}

export function replaceBrowserUrl(url: URL): void {
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(URL_STATE_EVENT));
}

function readUrlParameter(
  href: string,
  key: string,
  modelParameter: boolean
): string | null {
  if (!href) return null;
  const parameters = new URL(href).searchParams;
  if (
    modelParameter &&
    parameters.get("modelVersion") !== MODEL_STATE_VERSION
  ) {
    return null;
  }
  return parameters.get(key);
}

function persistUrlParameter(
  key: string,
  value: string,
  modelParameter: boolean
): void {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  if (modelParameter) {
    url.searchParams.set("modelVersion", MODEL_STATE_VERSION);
  }
  replaceBrowserUrl(url);
}

export function useUrlStringState(
  key: string,
  fallback: string,
  allowedValues: readonly string[],
  modelParameter = false
): readonly [string, Dispatch<SetStateAction<string>>] {
  const href = useUrlSnapshot();
  const requested = readUrlParameter(href, key, modelParameter);
  const value =
    requested !== null && allowedValues.includes(requested)
      ? requested
      : fallback;
  const setValue: Dispatch<SetStateAction<string>> = (next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    persistUrlParameter(key, resolved, modelParameter);
  };
  return [value, setValue];
}

export function useModelNumberState(
  key: string,
  fallback: number,
  minimum: number,
  maximum: number
): readonly [number, Dispatch<SetStateAction<number>>] {
  const href = useUrlSnapshot();
  const requested = Number(readUrlParameter(href, key, true) ?? Number.NaN);
  const value =
    Number.isInteger(requested) && requested >= minimum && requested <= maximum
      ? requested
      : fallback;
  const setValue: Dispatch<SetStateAction<number>> = (next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    persistUrlParameter(
      key,
      `${Math.max(minimum, Math.min(maximum, Math.round(resolved)))}`,
      true
    );
  };
  return [value, setValue];
}

export function useModelBooleanState(
  key: string,
  fallback: boolean
): readonly [boolean, Dispatch<SetStateAction<boolean>>] {
  const href = useUrlSnapshot();
  const requested = readUrlParameter(href, key, true);
  const value = requested === "1" ? true : requested === "0" ? false : fallback;
  const setValue: Dispatch<SetStateAction<boolean>> = (next) => {
    const resolved = typeof next === "function" ? next(value) : next;
    persistUrlParameter(key, resolved ? "1" : "0", true);
  };
  return [value, setValue];
}

export function MuseumRemoteImage({
  src,
  alt,
  sizes,
  className,
  unavailableText,
  eager = false,
}: {
  readonly src: string;
  readonly alt: string;
  readonly sizes: string;
  readonly className: string;
  readonly unavailableText: string;
  readonly eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt}
        className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-iron-900 tw-p-5 tw-text-center tw-text-sm tw-leading-6 tw-text-iron-400"
      >
        {unavailableText}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={eager}
      sizes={sizes}
      className={className}
      onError={() => setFailed(true)}
      unoptimized
    />
  );
}

export function coordinate(
  position: MuseumHeldPosition,
  label: string
): string {
  return position.coordinates.find((item) => item.label === label)?.value ?? "";
}

export function numericCoordinate(
  position: MuseumHeldPosition,
  label: string,
  fallback: number
): number {
  const parsed = Number.parseInt(coordinate(position, label), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function selectedHeldPosition(
  study: MuseumGenerativeStudy,
  selectedWorkId: string
): MuseumHeldPosition {
  const position =
    study.heldPositions.find((item) => item.objectId === selectedWorkId) ??
    study.heldPositions[0];
  if (position === undefined) throw new Error("museum_held_position_missing");
  return position;
}

export function MuseumDiamond({
  x,
  y,
}: {
  readonly x: number;
  readonly y: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <path
        d="M0 -8L8 0L0 8L-8 0Z"
        fill="#f5f5f5"
        stroke="#406afe"
        strokeWidth="3"
      />
      <circle r="2.2" fill="#406afe" />
    </g>
  );
}

export function ComparisonMarker({
  x,
  y,
}: {
  readonly x: number;
  readonly y: number;
}) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle r="8" fill="#131316" stroke="#84adff" strokeWidth="2" />
      <circle r="2.5" fill="#84adff" />
    </g>
  );
}

export function nextSeed(seed: number): number {
  return (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
}

export function seededUnit(seed: number, index: number): number {
  let value = seed >>> 0;
  for (let step = 0; step <= index; step += 1) value = nextSeed(value);
  return value / 4_294_967_296;
}

export function shuffledIndexes(
  length: number,
  seed: number
): readonly number[] {
  const result = Array.from({ length }, (_, index) => index);
  let state = seed;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = nextSeed(state);
    const destination = state % (index + 1);
    const current = result[index];
    result[index] = result[destination] ?? index;
    result[destination] = current ?? destination;
  }
  return result;
}

export function seedFromHash(hash: string): number {
  const parsed = Number.parseInt(hash.replace(/^0x/u, "").slice(0, 8), 16);
  return Number.isFinite(parsed) ? parsed >>> 0 : 1;
}

export function booleanTrait(value: string | undefined): boolean {
  return value?.toLowerCase() === "true" || value?.toLowerCase() === "yes";
}
