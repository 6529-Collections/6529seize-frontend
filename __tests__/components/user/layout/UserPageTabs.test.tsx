import React from 'react';
import { render, screen } from '@testing-library/react';
import UserPageTabs, { UserPageTabType } from '../../../../components/user/layout/UserPageTabs';
import { AuthContext } from '../../../../components/auth/Auth';
import { useRouter } from 'next/router';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
const useCapacitorMock = jest.fn();
jest.mock('../../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => useCapacitorMock() }));
jest.mock('../../../../components/user/layout/UserPageTab', () => ({ __esModule: true, default: (p: any) => <div data-testid="tab">{p.tab}</div> }));
jest.mock('../../../../components/cookies/CookieConsentContext', () => ({ 
  useCookieConsent: jest.fn()
}));

const { useCookieConsent } = require('../../../../components/cookies/CookieConsentContext');

const renderTabs = (showWaves: boolean, isIos: boolean, country: string = 'US') => {
  (useRouter as jest.Mock).mockReturnValue({ pathname: '/[user]/rep', query: {} });
  useCapacitorMock.mockReturnValue({ isIos });
  (useCookieConsent as jest.Mock).mockReturnValue({
    showCookieConsent: false,
    country,
    consent: jest.fn(),
    reject: jest.fn()
  });
  return render(
    <AuthContext.Provider value={{ showWaves } as any}>
      <UserPageTabs />
    </AuthContext.Provider>
  );
};

describe('UserPageTabs', () => {
  it('filters tabs based on context and platform', () => {
    renderTabs(false, false);
    const tabs = screen.getAllByTestId('tab').map(t => t.textContent);
    expect(tabs).not.toContain(UserPageTabType.BRAIN);
    expect(tabs).not.toContain(UserPageTabType.WAVES);
    expect(tabs).toContain(UserPageTabType.SUBSCRIPTIONS);
  });

  it('hides subscriptions tab on iOS and shows waves when enabled', () => {
    renderTabs(true, true, 'CA'); // Non-US country to trigger subscription hiding
    const tabs = screen.getAllByTestId('tab').map(t => t.textContent);
    expect(tabs).not.toContain(UserPageTabType.SUBSCRIPTIONS);
    expect(tabs).toContain(UserPageTabType.WAVES);
  });
});
