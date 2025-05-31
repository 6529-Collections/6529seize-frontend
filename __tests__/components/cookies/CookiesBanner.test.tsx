import { render, screen, fireEvent } from '@testing-library/react';
import CookiesBanner from '../../../components/cookies/CookiesBanner';
import { useCookieConsent } from '../../../components/cookies/CookieConsentContext';
import useIsMobileDevice from '../../../hooks/isMobileDevice';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../components/cookies/CookieConsentContext', () => ({ useCookieConsent: jest.fn() }));
jest.mock('../../../hooks/isMobileDevice');
jest.mock('next/image', () => (props: any) => <img {...props} />);

const { useRouter } = require('next/router');
const mockUseCookieConsent = useCookieConsent as jest.MockedFunction<typeof useCookieConsent>;
const mockUseIsMobileDevice = useIsMobileDevice as jest.MockedFunction<typeof useIsMobileDevice>;

describe('CookiesBanner', () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ pathname: '/' });
    mockUseCookieConsent.mockReturnValue({ consent: jest.fn(), reject: jest.fn() } as any);
    mockUseIsMobileDevice.mockReturnValue(false as any);
  });

  it('does not render on restricted routes', () => {
    useRouter.mockReturnValue({ pathname: '/restricted' });
    const { container } = render(<CookiesBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('calls consent when Accept clicked', () => {
    const consent = jest.fn();
    mockUseCookieConsent.mockReturnValue({ consent, reject: jest.fn() } as any);
    render(<CookiesBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Accept/i }));
    expect(consent).toHaveBeenCalled();
  });

  it('calls reject when Reject clicked', () => {
    const reject = jest.fn();
    mockUseCookieConsent.mockReturnValue({ consent: jest.fn(), reject } as any);
    render(<CookiesBanner />);
    fireEvent.click(screen.getByRole('button', { name: /Reject Non-Essential/i }));
    expect(reject).toHaveBeenCalled();
  });

  it('links to cookie policy', () => {
    render(<CookiesBanner />);
    expect(screen.getByRole('link', { name: /Learn more/i })).toHaveAttribute('href', '/about/cookie-policy');
  });
});
