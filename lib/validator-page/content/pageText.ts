/**
 * The 6529 app account testers send status files and logs to, by encrypted
 * DM. 6529 named it on 2026-11-01.
 */
export const VALIDATOR_STATUS_DM_ACCOUNT = "6529validators";

export function describeStatusDmAccount(): string {
  return `6529's account, ${VALIDATOR_STATUS_DM_ACCOUNT}`;
}

/** The owner's words on hardware for the test phase. Keep them verbatim. */
export const ANY_MACHINE_QUOTE =
  "None of this matters yet. Run it on any machine you have, from an old laptop to your current computer to a Raspberry Pi to a cloud VM, and tell us what works. These are guides for later, not requirements for the test phase.";

export const VALIDATOR_FEEDBACK_WAVE = "Ministry of Validation";

/** "0.1.0-rc.5" is shown as "0.1.0", the version testers talk about. */
export function getBaseVersion(version: string): string {
  return /^\d+\.\d+\.\d+/.exec(version)?.[0] ?? version;
}
