import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  CookieConsentProvider,
  getCookieConsentByName,
  useCookieConsent,
} from '../../../components/cookies/CookieConsentContext';

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock('../../../components/cookies/CookiesBanner', () => () => <div data-testid="banner" />);

jest.mock('../../../services/api/common-api', () => ({
  commonApiFetch: jest.fn(() => Promise.resolve({ is_eu: true, is_consent: false })),
  commonApiPost: jest.fn(() => Promise.resolve()),
  commonApiDelete: jest.fn(() => Promise.resolve()),
}));

const { get } = require('js-cookie');
const { commonApiFetch } = require('../../../services/api/common-api');

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('CookieConsentContext', () => {
  it('getCookieConsentByName parses values', () => {
    get.mockReturnValueOnce('true');
    expect(getCookieConsentByName('a')).toBe(true);
    get.mockReturnValueOnce('false');
    expect(getCookieConsentByName('b')).toBe(false);
    get.mockReturnValueOnce(undefined);
    expect(getCookieConsentByName('c')).toBeUndefined();
  });

  it('loads cookie consent on mount and shows banner', async () => {
    render(
      <CookieConsentProvider>
        <div>child</div>
      </CookieConsentProvider>
    );
    await act(flushPromises);
    expect(commonApiFetch).toHaveBeenCalled();
    expect(screen.getByTestId('banner')).toBeInTheDocument();
  });

  it('useCookieConsent throws outside provider', () => {
    function Wrapper() {
      useCookieConsent();
      return null;
    }
    expect(() => render(<Wrapper />)).toThrow('useCookieConsent must be used within a CookieConsentProvider');
  });
});

describe('CookieConsentProvider actions', () => {
  it('consent sends API request and sets cookies', async () => {
    const { set } = require('js-cookie');
    const { commonApiPost } = require('../../../services/api/common-api');
    function Consumer() {
      const { consent } = useCookieConsent();
      return <button onClick={consent}>consent</button>;
    }
    render(
      <CookieConsentProvider>
        <Consumer />
      </CookieConsentProvider>
    );
    await act(async () => {
      await userEvent.click(screen.getByText('consent'));
    });
    expect(commonApiPost).toHaveBeenCalledWith({ endpoint: 'policies/cookies-consent', body: {} });
    expect(set).toHaveBeenCalledWith('essential-cookies-consent', 'true', { expires: 365 });
    expect(set).toHaveBeenCalledWith('performance-cookies-consent', 'true', { expires: 365 });
  });

  it('reject sends API request and sets cookies', async () => {
    const { set } = require('js-cookie');
    const { commonApiDelete } = require('../../../services/api/common-api');
    function Consumer() {
      const { reject } = useCookieConsent();
      return <button onClick={reject}>reject</button>;
    }
    render(
      <CookieConsentProvider>
        <Consumer />
      </CookieConsentProvider>
    );
    await act(async () => {
      await userEvent.click(screen.getByText('reject'));
    });
    expect(commonApiDelete).toHaveBeenCalledWith({ endpoint: 'policies/cookies-consent' });
    expect(set).toHaveBeenCalledWith('essential-cookies-consent', 'true', { expires: 365 });
    expect(set).toHaveBeenCalledWith('performance-cookies-consent', 'false', { expires: 365 });
  });
});
