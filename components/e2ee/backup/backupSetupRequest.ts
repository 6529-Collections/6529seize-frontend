export const E2EE_BACKUP_SETUP_EVENT = "6529:e2ee-backup-setup";

/**
 * Asks the encrypted backup card on this page to start setting up backup
 * (for example "Set up backup first" in the revoke-this-browser dialog). The
 * card starts setup only while backup is off.
 */
export function requestE2eeBackupSetup(): void {
  globalThis.dispatchEvent(new Event(E2EE_BACKUP_SETUP_EVENT));
}
