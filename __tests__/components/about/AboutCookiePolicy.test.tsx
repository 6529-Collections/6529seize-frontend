import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AboutCookiePolicy from '@/components/about/AboutCookiePolicy';

jest.mock('react-toggle', () => (props: any) => (
  <input type="checkbox" {...props} />
));

jest.mock('@/components/cookies/CookieConsentContext', () => ({
  useCookieConsent: jest.fn(),
  getCookieConsentByName: jest.fn(),
}));

const { useCookieConsent, getCookieConsentByName } = jest.requireMock(
  '../../../components/cookies/CookieConsentContext'
);

describe('AboutCookiePolicy', () => {
  const consent = jest.fn();
  const reject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCookieConsent as jest.Mock).mockReturnValue({
      showCookieConsent: false,
      consent,
      reject,
    });
    (getCookieConsentByName as jest.Mock).mockReturnValue(false);
  });

  it('renders cookie policy heading', () => {
    render(<AboutCookiePolicy />);
    expect(screen.getByRole('heading', { name: /Cookie Policy/i })).toBeInTheDocument();
  });

  it('enables performance cookies when toggled on', async () => {
    const user = userEvent.setup();
    render(<AboutCookiePolicy />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(consent).toHaveBeenCalled();
    expect(checkbox).toBeChecked();
  });

  it('disables performance cookies when toggled off', async () => {
    const user = userEvent.setup();
    (getCookieConsentByName as jest.Mock).mockReturnValue(true);
    render(<AboutCookiePolicy />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(reject).toHaveBeenCalled();
    expect(checkbox).not.toBeChecked();
  });
});
