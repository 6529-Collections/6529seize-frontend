import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { isDropAuthorSigned } from "./authorSignedClaim";
import type { SealState, VerdictDrop } from "./dropSignatureVerdicts";

export { isDropAuthorSigned } from "./authorSignedClaim";

const WITH_LABEL_KEYS = {
  verified: "signedMessages.marker.withLabel",
  failed: "signedMessages.marker.withLabelFailed",
  pending: "signedMessages.marker.withLabelUnverified",
  unverified: "signedMessages.marker.withLabelUnverified",
} as const satisfies Record<SealState, string>;

/**
 * The name of a control that is the whole drop card (so the seal inside it
 * is static), with the drop's signed status joined when 6529.io marks it
 * signed. "Signed by its author" is joined only once this browser verified
 * the signature (`state`); until then it says signed, not yet verified.
 */
export const authorSignedLabel = (
  locale: SupportedLocale,
  label: string,
  drop: VerdictDrop,
  state: SealState
): string =>
  isDropAuthorSigned(drop)
    ? t(locale, WITH_LABEL_KEYS[state], { label })
    : label;
