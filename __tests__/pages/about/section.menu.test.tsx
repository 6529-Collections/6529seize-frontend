import { render, screen } from '@testing-library/react';
import React from 'react';
import { AuthContext } from '../../../components/auth/Auth';
jest.mock('next/router', () => ({ useRouter: () => ({ asPath: '/', push: jest.fn() }) }));

jest.mock('../../../hooks/useCapacitor', () => ({ __esModule: true, default: () => ({ isIos: true }) }));

let country = 'DE';
jest.mock('../../../components/cookies/CookieConsentContext', () => ({ useCookieConsent: () => ({ country }) }));

const setTitle = jest.fn();
const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <AuthContext.Provider value={{ setTitle } as any}>{children}</AuthContext.Provider>
);


// Mock TitleContext
jest.mock('../../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('AboutMenu subscriptions row', () => {
  beforeEach(() => { country = 'DE'; });
  it('hides subscriptions row when not US', () => {
    const AboutModule = require('../../../pages/about/[section]');
    const Comp = AboutModule.default;
    render(<Comp pageProps={{ section: AboutModule.AboutSection.MEMES, sectionTitle: 'THE MEMES' }} />, { wrapper: Wrapper });
    expect(screen.queryByText('Subscriptions')).toBeNull();
  });

  it('shows subscriptions row in US', () => {
    country = 'US';
    const AboutModule = require('../../../pages/about/[section]');
    const Comp = AboutModule.default;
    render(<Comp pageProps={{ section: AboutModule.AboutSection.MEMES, sectionTitle: 'THE MEMES' }} />, { wrapper: Wrapper });
    expect(screen.getAllByText('Subscriptions').length).toBeGreaterThan(0);
  });
});
