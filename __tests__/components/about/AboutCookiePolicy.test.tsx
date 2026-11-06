import { render, screen, within } from '@testing-library/react';
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

  it('lists the AWS CloudWatch RUM cookies as performance cookies', () => {
    render(<AboutCookiePolicy />);
    const performanceTable = screen.getByRole('region', {
      name: /Performance Cookies/i,
    });

    const userIdRow = within(performanceTable)
      .getByText(/^cwr_u \(Amazon CloudWatch RUM, Amazon Web Services\)/)
      .closest('tr');
    expect(userIdRow).not.toBeNull();
    expect(userIdRow).toHaveTextContent('.6529.io');
    expect(userIdRow).toHaveTextContent(/random visitor ID/i);
    expect(userIdRow).toHaveTextContent('First Party');
    expect(userIdRow).toHaveTextContent('30 days');

    const sessionRow = within(performanceTable)
      .getByText(/^cwr_s \(Amazon CloudWatch RUM, Amazon Web Services\)/)
      .closest('tr');
    expect(sessionRow).not.toBeNull();
    expect(sessionRow).toHaveTextContent(/session ID/i);
    expect(sessionRow).toHaveTextContent('30 minutes after your last activity');

    expect(
      screen.getByText(/We use Amazon CloudWatch RUM to measure page load speed/)
    ).toBeInTheDocument();
  });

  it('shows the localized last updated date', () => {
    render(<AboutCookiePolicy />);
    expect(
      screen.getByText('Last Updated: November 6, 2026')
    ).toBeInTheDocument();
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
