"use client";

import { createContext } from "react";

/**
 * True inside 6529 Desktop when the saved profiles could not be restored. The
 * app then runs signed out: wallet sign-in and reconnection stay off, because
 * the shell refuses to save profiles until a restore succeeds.
 */
export const DesktopProfileRecoveryContext = createContext(false);

/**
 * True inside 6529 Desktop while the saved profiles are being restored. The
 * wallet stack waits on its wallet-free config, so it never reconnects a
 * wallet that the restore is about to replace.
 */
export const DesktopProfileRestoringContext = createContext(false);
