import { render, screen } from '@testing-library/react';
import UserPageHeaderAboutStatement from '@/components/user/user-page-header/about/UserPageHeaderAboutStatement';
import { CicStatement } from '@/entities/IProfile';

describe('UserPageHeaderAboutStatement', () => {
  it('shows placeholder when statement is null', () => {
    render(<UserPageHeaderAboutStatement statement={null} />);
    expect(screen.getByText('Click to add an About statement')).toBeInTheDocument();
  });

  it('renders statement value when provided', () => {
    const statement: CicStatement = { statement_value: 'Hello there' } as any;
    render(<UserPageHeaderAboutStatement statement={statement} />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });
});
