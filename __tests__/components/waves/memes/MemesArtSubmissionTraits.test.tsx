import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MemesArtSubmissionTraits from '../../../../components/waves/memes/MemesArtSubmissionTraits';

jest.mock('../../../../components/waves/memes/traits/Section', () => ({ Section: ({ children, title }: any) => <div><div>{title}</div>{children}</div> }));
jest.mock('../../../../components/waves/memes/traits/TraitField', () => ({ TraitField: ({ definition, updateText }: any) => (
  <button data-testid={definition.field} onClick={() => updateText(definition.field, 'x')} />
)}));

jest.mock('../../../../components/waves/memes/traits/schema', () => ({
  getFormSections: () => [{ title: 'T', layout: 'single', fields: [{ field: 'artist', label: 'Artist', type: 'text' }] }],
}));

jest.mock('../../../../components/auth/Auth', () => ({ useAuth: jest.fn(() => ({ connectedProfile: { handle: 'me' } })) }));

describe('MemesArtSubmissionTraits', () => {
  it('renders fields and updates traits', async () => {
    const user = userEvent.setup();
    const setTraits = jest.fn();
    render(<MemesArtSubmissionTraits traits={{} as any} setTraits={setTraits} />);
    expect(screen.getByText('T')).toBeInTheDocument();
    await user.click(screen.getByTestId('artist'));
    expect(setTraits).toHaveBeenCalledWith({ artist: 'x' });
  });
});
