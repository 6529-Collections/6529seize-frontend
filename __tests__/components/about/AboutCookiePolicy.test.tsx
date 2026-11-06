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

jest.mock('@/hooks/useBrowserLocale', () => ({
  useBrowserLocale: jest.fn(() => 'en-US'),
}));

const { useCookieConsent, getCookieConsentByName } = jest.requireMock(
  '../../../components/cookies/CookieConsentContext'
);
const { useBrowserLocale } = jest.requireMock('@/hooks/useBrowserLocale');

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
    (useBrowserLocale as jest.Mock).mockReturnValue('en-US');
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
    expect(sessionRow).toHaveTextContent('30 minutes after last activity');

    expect(
      screen.getByText(
        /We use Amazon CloudWatch RUM .* it sets the cwr_u and cwr_s performance cookies\./
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /currently set whether or not you accept performance cookies/
      )
    ).toBeInTheDocument();
  });

  it('renders the shared table labels from messages', () => {
    render(<AboutCookiePolicy />);
    expect(screen.getAllByRole('columnheader', { name: 'Lifespan' })).toHaveLength(2);
    const necessaryTable = screen.getByRole('region', {
      name: /Strictly Necessary Cookies/i,
    });
    const albRow = within(necessaryTable).getByText('AWSALBTG').closest('tr');
    expect(albRow).toHaveTextContent('First Party');
    expect(albRow).toHaveTextContent('7 days');
  });

  it.each([
    ['en-US', 'Last Updated: November 6, 2026'],
    ['de-DE', 'Last Updated: 6. November 2026'],
  ])('formats the last updated date for %s', (locale, expected) => {
    (useBrowserLocale as jest.Mock).mockReturnValue(locale);
    render(<AboutCookiePolicy />);
    expect(screen.getByText(expected)).toBeInTheDocument();
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
