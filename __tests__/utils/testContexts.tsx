import React from 'react';
import { render } from '@testing-library/react';
import { AuthContext } from '../../components/auth/Auth';
export type AuthContextType = React.ContextType<typeof AuthContext>;

export const createMockAuthContext = (
  overrides: Partial<AuthContextType> = {}
): AuthContextType => ({
  connectedProfile: null,
  fetchingProfile: false,
  connectionStatus: 0 as any,
  receivedProfileProxies: [],
  activeProfileProxy: null,
  showWaves: false,
  requestAuth: jest.fn(async () => ({ success: false })),
  setToast: jest.fn(),
  setActiveProfileProxy: jest.fn(async () => {}),
  setTitle: jest.fn(),
  title: '',
  ...overrides,
});

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
