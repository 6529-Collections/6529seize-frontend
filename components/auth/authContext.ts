"use client";

import { createContext, useContext } from "react";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import type { AuthContextType } from "./authTypes";

export const AuthContext = createContext<AuthContextType>({
  connectedProfile: null,
  isAuthenticated: false,
  fetchingProfile: false,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  connectionStatus: ProfileConnectedStatus.NOT_CONNECTED,
  showWaves: false,
  requestAuth: async () => ({ success: false }),
  sessionUpgradeRequired: false,
  requestSessionUpgrade: async () => ({ success: false }),
  ensureActiveSessionV2WebSession: async () => false,
  setToast: () => {},
  setActiveProfileProxy: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};
