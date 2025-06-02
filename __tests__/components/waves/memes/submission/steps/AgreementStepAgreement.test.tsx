import { render, screen } from '@testing-library/react';
import AgreementStepAgreement from '../../../../../../components/waves/memes/submission/steps/AgreementStepAgreement';

describe('AgreementStepAgreement', () => {
  it('renders markdown content', () => {
    render(<AgreementStepAgreement text={'# Title\n[link](https://example.com)'} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('nofollow'));
  });

  it('sanitizes disallowed html', () => {
    render(<AgreementStepAgreement text={'<script>bad()</script>'} />);
    expect(screen.queryByText('bad()')).toBeNull();
  });
});
