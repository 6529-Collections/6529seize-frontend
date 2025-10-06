import React from 'react';
import { render, screen } from '@testing-library/react';
import ProfileActivityLogGeneralStatement from '@/components/profile-activity/list/items/ProfileActivityLogGeneralStatement';

jest.mock('@/components/profile-activity/list/items/utils/ProfileActivityLogItemAction', () => () => <span data-testid="action" />);

describe('ProfileActivityLogGeneralStatement', () => {
  it('displays statement text', () => {
    const log = { contents:{ statement:{ statement_value:'Hello world' } } } as any;
    render(<ProfileActivityLogGeneralStatement log={log} />);
    expect(screen.getByTestId('action')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
