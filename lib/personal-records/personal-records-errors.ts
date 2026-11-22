/**
 * Why a settings change saved as signed records did not save. The message
 * is what the person reads; it is the API's refusal detail when there is
 * one, or today's message for the rule code.
 */
export class PersonalRecordsError extends Error {
  /** The API's rule code (today's code for the same refusal), when a rule refused. */
  readonly code: string | undefined;
  /** Why: the API's refusal or rejection reason, `no-grant`, `unavailable` or `signing`. */
  readonly reason: string;

  constructor(
    message: string,
    { reason, code }: { readonly reason: string; readonly code?: string }
  ) {
    super(message);
    this.name = "PersonalRecordsError";
    this.reason = reason;
    this.code = code;
  }
}

/** Today's messages for the API's rule codes, when a refusal has no detail. */
const RULE_MESSAGES: Readonly<Partial<Record<string, string>>> = {
  PROFILE_REQUIRED: "Create a 6529.io profile before saving settings.",
  TARGET_NOT_FOUND: "That profile does not exist.",
  TARGET_NOT_CANONICAL:
    "That profile could not be named. Reload and try again.",
  SELF: "You can't change this setting for your own profile.",
  BLOCKED: "You can't do this for a profile you have blocked.",
  DROP_NOT_FOUND: "That drop does not exist.",
  WAVE_NOT_FOUND: "That wave does not exist.",
  GROUP_NOT_SELECTABLE:
    "Choose a group you can see to limit who can message you.",
  ALIAS_LIMIT: "You can create up to 20 mention shortcuts.",
  ALIAS_EXISTS: "You already have a mention shortcut with that name.",
};

export const PERSONAL_RECORDS_MESSAGES = {
  noGrant:
    "Turn on signing on this device to save this setting. It takes one wallet signature.",
  unavailable: "Settings can't be saved right now. Try again in a minute.",
  signing: "This device couldn't sign the change. Try again.",
  unsupported:
    "This browser can't save private settings. Update it and try again.",
  notSaved: "The setting wasn't saved. Try again.",
  proxy: "Proxies can't change settings.",
  outOfOrder:
    "A newer change from another device or tab came first. Reload and try again.",
  paused: "Settings are paused for a few minutes. Try again shortly.",
  noPrincipal:
    "This wallet isn't part of a 6529 identity yet, so this setting can't be saved.",
} as const;

/** The readable message for a refused or rejected record. */
export function refusalMessage({
  detail,
  code,
}: {
  readonly detail?: string | undefined;
  readonly code?: string | undefined;
}): string {
  const trimmed = detail?.trim();
  if (trimmed) {
    return trimmed;
  }
  const ruleMessage = code === undefined ? undefined : RULE_MESSAGES[code];
  return ruleMessage ?? PERSONAL_RECORDS_MESSAGES.notSaved;
}
