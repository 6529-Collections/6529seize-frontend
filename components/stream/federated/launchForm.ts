import type { SupportedLocale } from "@/i18n/locales";
import { type MessageKey, t } from "@/i18n/messages";
import "@/i18n/namespaces/stream";
import type {
  FederatedDeployRequest,
  FederatedForm,
  TokenStandard,
} from "@/lib/stream/types";

/** The launch wizard's step 3 input, as typed. */
export interface LaunchDetails {
  readonly name: string;
  readonly symbol: string;
  /** A pair's ERC-1155 half; empty means the derived default. */
  readonly editionName: string;
  readonly editionSymbol: string;
  /** One of `LICENSE_CHOICES`, or "custom". */
  readonly license: string;
  readonly customLicense: string;
}

export type LaunchField =
  | "name"
  | "symbol"
  | "editionName"
  | "editionSymbol"
  | "customLicense";

export type LaunchErrors = Partial<Record<LaunchField, MessageKey>>;

/** The licenses the wizard offers first; any other SPDX ID or LicenseRef works too. */
export const LICENSE_CHOICES = [
  "CC0-1.0",
  "CC-BY-4.0",
  "CC-BY-NC-4.0",
  "LicenseRef-All-Rights-Reserved",
] as const;

export const CUSTOM_LICENSE = "custom";

export const EMPTY_DETAILS: LaunchDetails = {
  name: "",
  symbol: "",
  editionName: "",
  editionSymbol: "",
  license: "CC0-1.0",
  customLicense: "",
};

export const FORMS: readonly FederatedForm[] = ["ERC721", "ERC1155", "PAIR"];

const MAX_NAME = 64;
const SYMBOL = /^[A-Z0-9]{1,11}$/;
const LICENSE_ID = /^(LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9][A-Za-z0-9.+-]*)$/;

/** The contracts a form deploys, 721 first. */
export function standardsOf(form: FederatedForm): readonly TokenStandard[] {
  return form === "PAIR" ? ["ERC721", "ERC1155"] : [form];
}

/** A pair's editions name when left empty: "<name> Editions", from the copy. */
export function editionNameOf(
  details: LaunchDetails,
  locale: SupportedLocale
): string {
  const typed = details.editionName.trim();
  return typed === ""
    ? t(locale, "stream.launch.details.editionNameDefault", {
        name: details.name.trim(),
      })
    : typed;
}

/** A pair's editions symbol when left empty: the 1/1 symbol plus "E". */
export function editionSymbolOf(details: LaunchDetails): string {
  const typed = details.editionSymbol.trim();
  return typed === "" ? `${details.symbol.trim()}E` : typed;
}

export function licenseOf(details: LaunchDetails): string {
  return details.license === CUSTOM_LICENSE
    ? details.customLicense.trim()
    : details.license;
}

function nameError(value: string): MessageKey | undefined {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "stream.launch.error.nameRequired";
  }
  return trimmed.length > MAX_NAME ? "stream.launch.error.nameLong" : undefined;
}

function symbolError(value: string): MessageKey | undefined {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "stream.launch.error.symbolRequired";
  }
  return SYMBOL.test(trimmed) ? undefined : "stream.launch.error.symbolFormat";
}

/** Inline errors for step 3; an empty object means the step is valid. */
export function validateDetails(
  form: FederatedForm,
  details: LaunchDetails,
  locale: SupportedLocale
): LaunchErrors {
  const found: [LaunchField, MessageKey | undefined][] = [
    ["name", nameError(details.name)],
    ["symbol", symbolError(details.symbol)],
  ];
  if (form === "PAIR") {
    // The editions half's defaults derive from the 1/1 half, so they are only
    // checked once the 1/1 name and symbol are there.
    if (details.name.trim() !== "") {
      found.push(["editionName", nameError(editionNameOf(details, locale))]);
    }
    if (details.symbol.trim() !== "") {
      const editionSymbol = editionSymbolOf(details);
      found.push([
        "editionSymbol",
        symbolError(editionSymbol) ??
          (editionSymbol === details.symbol.trim()
            ? "stream.launch.error.symbolSame"
            : undefined),
      ]);
    }
  }
  if (
    details.license === CUSTOM_LICENSE &&
    !LICENSE_ID.test(details.customLicense.trim())
  ) {
    found.push(["customLicense", "stream.launch.error.licenseFormat"]);
  }
  const errors: LaunchErrors = {};
  for (const [field, error] of found) {
    if (error !== undefined) {
      errors[field] = error;
    }
  }
  return errors;
}

/** The factory call the review step sends. */
export function toDeployRequest(
  form: FederatedForm,
  details: LaunchDetails,
  locale: SupportedLocale
): FederatedDeployRequest {
  const base = {
    form,
    name: details.name.trim(),
    symbol: details.symbol.trim(),
    defaultLicense: licenseOf(details),
  };
  return form === "PAIR"
    ? {
        ...base,
        editionName: editionNameOf(details, locale),
        editionSymbol: editionSymbolOf(details),
      }
    : base;
}
