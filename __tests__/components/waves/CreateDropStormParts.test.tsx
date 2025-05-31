import { render, screen } from '@testing-library/react';
import React from 'react';
import CreateDropStormParts from '../../../components/waves/CreateDropStormParts';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('../../../components/waves/CreateDropStormPart', () => ({
  __esModule: true,
  default: ({ partIndex }: any) => <div data-testid={`part-${partIndex}`} />,
}));

const authValue = {
  connectedProfile: { handle: 'user', pfp: 'img.png', level: 1, cic: 0 },
} as any;

describe('CreateDropStormParts', () => {
  it('renders parts with profile info', () => {
    const parts = [{ content: 'a' }, { content: 'b' }] as any;
    render(
      <AuthContext.Provider value={authValue}>
        <CreateDropStormParts
          parts={parts}
          mentionedUsers={[]}
          referencedNfts={[]}
          onRemovePart={jest.fn()}
        />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('part-0')).toBeInTheDocument();
    expect(screen.getByTestId('part-1')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'img.png');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/user');
  });
});
