import { getDesktopNativeAuth } from "@/helpers/desktop-shell";
import type {
  DesktopNativeAuth,
  DesktopProfileState,
} from "@/types/desktop-shell";

/**
 * Keeps the desktop shell's encrypted copy of the signed-in profiles in step
 * with the page. The page's own storage depends on the local server's port,
 * so the shell's copy is what survives a port change or a reinstall.
 */

type SaveStatus = "idle" | "failed" | "retrying";

interface SavableAccount {
  readonly address: string;
  readonly role: string | null;
  readonly jwt: string | null;
  readonly profileId: string | null;
  readonly profileHandle: string | null;
  readonly authSessionVersion?: "v2" | null | undefined;
}

let initialization: Promise<void> | null = null;
let initialized = false;
let unsavedState: DesktopProfileState | null = null;
let saveAttempt: Promise<void> | null = null;
let saveStatus: SaveStatus = "idle";
const listeners = new Set<() => void>();

function setSaveStatus(status: SaveStatus): void {
  if (saveStatus === status) return;
  saveStatus = status;
  listeners.forEach((listener) => listener());
}

export const getDesktopProfileSaveStatus = (): SaveStatus => saveStatus;
export const getDesktopProfileServerSaveStatus = (): SaveStatus => "idle";

export function subscribeDesktopProfileSaveStatus(
  listener: () => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const reportSaveFailure = () => {
  console.error("Could not persist Desktop profiles");
};

async function saveLatestDesktopProfiles(
  nativeAuth: DesktopNativeAuth
): Promise<void> {
  try {
    while (unsavedState) {
      const state = unsavedState;
      await nativeAuth.saveProfiles(state);
      // A newer change supersedes this snapshot; clear only the one the shell
      // acknowledged, then save the latest pending state.
      if (unsavedState === state) unsavedState = null;
    }
    setSaveStatus("idle");
  } catch (error: unknown) {
    setSaveStatus("failed");
    throw error;
  } finally {
    saveAttempt = null;
    // A subscriber can queue a change as the save reports success; save it
    // too, without looping on persistence failures.
    if (unsavedState && saveStatus !== "failed") {
      retryDesktopProfileSave().catch(reportSaveFailure);
    }
  }
}

/** Retry the latest complete snapshot, never an older pre-logout state. */
export function retryDesktopProfileSave(): Promise<void> {
  const nativeAuth = getDesktopNativeAuth();
  if (!initialized || !nativeAuth || !unsavedState) return Promise.resolve();
  if (saveAttempt) return saveAttempt;
  if (saveStatus === "failed") setSaveStatus("retrying");
  saveAttempt = saveLatestDesktopProfiles(nativeAuth);
  return saveAttempt;
}

/** Tell the shell the first screen is ready (the Electron app shows its window then). */
export function notifyDesktopProfilesReady(): void {
  const nativeAuth = getDesktopNativeAuth();
  if (!nativeAuth) return;
  void Promise.resolve()
    .then(() => nativeAuth.profilesReady())
    .catch(() => {
      console.error("Could not announce Desktop profile readiness");
    });
}

export async function restartDesktopProfileRestore(): Promise<void> {
  const nativeAuth = getDesktopNativeAuth();
  if (!nativeAuth) throw new Error("Desktop profile restart is unavailable");
  await nativeAuth.restartProfileRestore();
}

/**
 * Ask the shell for its saved profiles, offering the page's current ones for
 * a first-run merge. `restore` writes the result into page storage before any
 * save is allowed, so start-up never echoes the state back to the shell.
 */
export function initializeDesktopProfiles(
  current: DesktopProfileState,
  restore: (state: DesktopProfileState) => void
): Promise<void> {
  const nativeAuth = getDesktopNativeAuth();
  if (!nativeAuth) return Promise.resolve();
  initialization ??= restoreDesktopProfiles(nativeAuth, current, restore);
  return initialization;
}

async function restoreDesktopProfiles(
  nativeAuth: DesktopNativeAuth,
  current: DesktopProfileState,
  restore: (state: DesktopProfileState) => void
): Promise<void> {
  try {
    restore(await nativeAuth.restoreProfiles(current));
    initialized = true;
  } catch (error: unknown) {
    initialization = null;
    throw error;
  }
}

/** Save the page's profiles to the shell after every account change. */
export function persistDesktopProfileAccounts(
  accounts: readonly SavableAccount[],
  activeAddress: string | null
): void {
  if (!initialized || !getDesktopNativeAuth()) return;
  unsavedState = {
    version: 1,
    accounts: accounts.map((account) => ({
      address: account.address,
      role: account.role,
      jwt: account.jwt,
      profileId: account.profileId,
      profileHandle: account.profileHandle,
      authSessionVersion: account.authSessionVersion ?? null,
      refreshToken: null,
    })),
    activeAddress,
  };
  retryDesktopProfileSave().catch(reportSaveFailure);
}

export function __resetDesktopProfileStorageForTests(): void {
  initialization = null;
  initialized = false;
  unsavedState = null;
  saveAttempt = null;
  saveStatus = "idle";
  listeners.clear();
}
