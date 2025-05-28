import { render, screen } from '@testing-library/react';
import PrimaryButtonLink from '../../../../components/utils/button/PrimaryButtonLink';

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));

describe('PrimaryButtonLink', () => {
  it('renders link with href', () => {
    render(<PrimaryButtonLink href="/path">Go</PrimaryButtonLink>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/path');
    expect(link).toHaveTextContent('Go');
  });

  it('applies custom padding', () => {
    render(<PrimaryButtonLink href="/a" padding="p-1">Ok</PrimaryButtonLink>);
    expect(screen.getByRole('link')).toHaveClass('p-1');
  });
});
