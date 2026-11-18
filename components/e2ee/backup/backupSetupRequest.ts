export const E2EE_BACKUP_SETUP_EVENT = "6529:e2ee-backup-setup";

/**
 * A request to start backup setup, kept until a backup card takes it: the
 * card may be on this page already or mount after a navigation.
 */
let pending = false;

/**
 * Asks the encrypted backup card to start setting up backup ("Set up backup
 * first", "One more step", the inbox reminder). The card starts setup while
 * backup is off and opens restore when a backup from another device exists.
 */
export function requestE2eeBackupSetup(): void {
  pending = true;
  globalThis.dispatchEvent(new Event(E2EE_BACKUP_SETUP_EVENT));
}

/** Takes the pending request, if any; a request is acted on once. */
export function takeE2eeBackupSetupRequest(): boolean {
  const requested = pending;
  pending = false;
  return requested;
}
