import React from "react";
import { render } from "@testing-library/react";
import { AuthContext } from "@/components/auth/Auth";
type AuthContextType = React.ContextType<typeof AuthContext>;

const defaultConnectedProfile = {
  id: "test-id",
  handle: "test-handle",
  normalised_handle: "test-handle",
  pfp: null,
  cic: 0,
  rep: 0,
  level: 1,
  tdh: 0,
  consolidation_key: "test-key",
  display: "Test User",
  primary_wallet: "0x123",
  banner1: null,
  banner2: null,
  classification: "PSEUDONYM" as any,
  sub_classification: null,
  wallets: [],
};

export const createMockAuthContext = (
  overrides: Partial<AuthContextType> = {}
): AuthContextType => ({
  connectedProfile: defaultConnectedProfile,
  fetchingProfile: false,
  connectionStatus: "CONNECTED" as any,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  showWaves: false,
  requestAuth: jest.fn(async () => ({ success: false })),
  setToast: jest.fn(),
  setActiveProfileProxy: jest.fn(async () => {}),
  ...overrides,
} as unknown as AuthContextType);

export const renderWithAuth = (
  component: React.ReactElement,
  authValue: Partial<AuthContextType> = {}
) => {
  return render(
    <AuthContext.Provider value={createMockAuthContext(authValue)}>
      {component}
    </AuthContext.Provider>
  );
};
