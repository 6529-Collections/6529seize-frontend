import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EULAConsentProvider, useEULAConsent } from '@/components/eula/EULAConsentContext';
import { AuthContext } from '@/components/auth/Auth';
import { CONSENT_EULA_COOKIE } from '@/constants';

jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock('@/components/eula/EULAModal', () => () => <div data-testid="modal" />);

jest.mock('@/services/api/common-api', () => ({
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

jest.mock('@/hooks/useCapacitor', () => ({
  __esModule: true,
  default: () => ({ isIos: true, platform: 'ios' }),
}));

jest.mock('@capacitor/device', () => ({
  Device: { getId: jest.fn() },
}));

const { get, set } = require('js-cookie');
const { commonApiFetch, commonApiPost } = require('@/services/api/common-api');
const { Device } = require('@capacitor/device');

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

function renderProvider(children: React.ReactNode, auth: any = { setToast: jest.fn() }) {
  return render(
    <AuthContext.Provider value={auth}>
      <EULAConsentProvider>{children}</EULAConsentProvider>
    </AuthContext.Provider>
  );
}

describe('EULAConsentContext', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('useEULAConsent throws outside provider', () => {
    const Wrapper = () => {
      useEULAConsent();
      return null;
    };
    expect(() => render(<Wrapper />)).toThrow('useEULAConsent must be used within a EULAConsentProvider');
  });

  it('shows modal when no cookie and consent not found', async () => {
    get.mockReturnValueOnce(undefined);
    Device.getId.mockResolvedValue({ identifier: 'device' });
    commonApiFetch.mockResolvedValue({});

    renderProvider(<div />);
    await act(flushPromises);

    expect(commonApiFetch).toHaveBeenCalled();
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(set).not.toHaveBeenCalled();
  });

  it('sets cookie and hides modal when consent exists', async () => {
    get.mockReturnValueOnce(undefined);
    Device.getId.mockResolvedValue({ identifier: 'device' });
    commonApiFetch.mockResolvedValue({ accepted_at: Date.now() });

    renderProvider(<div />);
    await act(flushPromises);

    expect(set).toHaveBeenCalledWith(
      CONSENT_EULA_COOKIE,
      'true',
      { expires: expect.any(Date) }
    );
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('posts consent and hides modal when consent() called', async () => {
    get.mockReturnValueOnce(undefined);
    Device.getId.mockResolvedValue({ identifier: 'device' });
    commonApiFetch.mockResolvedValue({});
    commonApiPost.mockResolvedValue({});

    const TestComp = () => {
      const { consent } = useEULAConsent();
      return <button onClick={consent}>agree</button>;
    };

    renderProvider(<TestComp />);
    await act(flushPromises);

    expect(screen.getByTestId('modal')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('agree'));
      await flushPromises();
    });

    expect(commonApiPost).toHaveBeenCalledWith({
      endpoint: 'policies/eula-consent',
      body: { device_id: 'device', platform: 'ios' },
    });
    expect(set).toHaveBeenCalledWith(CONSENT_EULA_COOKIE, 'true', { expires: 365 });
  });
});

