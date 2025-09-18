import { render, screen } from '@testing-library/react';
import SpinnerLoader from '../../../components/common/SpinnerLoader';

describe('SpinnerLoader', () => {
  it('announces default loading status with polite live region', () => {
    render(<SpinnerLoader />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-label', 'Loading...');

    const srOnlyText = screen.getByText('Loading...', { selector: 'span' });
    expect(srOnlyText).toHaveClass('tw-sr-only');

    const visibleText = screen.getByText('Loading...', { selector: 'div' });
    expect(visibleText).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses custom ariaLabel while keeping visible text hidden from screen readers', () => {
    render(<SpinnerLoader text="Loading data" ariaLabel="Fetching data" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-label', 'Fetching data');

    const srOnlyText = screen.getByText('Fetching data', { selector: 'span' });
    expect(srOnlyText).toHaveClass('tw-sr-only');

    const visibleText = screen.getByText('Loading data', { selector: 'div' });
    expect(visibleText).toHaveAttribute('aria-hidden', 'true');
  });
});
