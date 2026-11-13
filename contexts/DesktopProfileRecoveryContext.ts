"use client";

import { createContext } from "react";

/**
 * True inside 6529 Desktop when the saved profiles could not be restored. The
 * app then runs signed out: wallet sign-in and reconnection stay off, because
 * the shell refuses to save profiles until a restore succeeds.
 */
export const DesktopProfileRecoveryContext = createContext(false);
