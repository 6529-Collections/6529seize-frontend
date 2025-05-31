import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../../components/drops/view/part/DropPartMarkdown', () => () => (
  <div data-testid="markdown" />
));

import CreateDropStormPart from '../../../components/waves/CreateDropStormPart';

const part = { content: 'hello', media: [] } as any;

describe('CreateDropStormPart', () => {
  it('renders part info and handles remove', async () => {
    const onRemove = jest.fn();
    render(
      <CreateDropStormPart
        partIndex={0}
        part={part}
        mentionedUsers={[]}
        referencedNfts={[]}
        onRemovePart={onRemove}
      />
    );

    expect(screen.getByText('Part 1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(onRemove).toHaveBeenCalledWith(0);
    expect(screen.getByTestId('markdown')).toBeInTheDocument();
  });
});
