import React from 'react';
import { render } from '@testing-library/react';
import GasPage from '../../pages/meme-gas';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('GasPage', () => {
  it('sets page title and renders gas component', () => {
    const setTitle = jest.fn();
    const { getByTestId } = render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <GasPage />
      </AuthContext.Provider>
    );
    expect(setTitle).toHaveBeenCalledWith({ title: 'Meme Gas | Tools' });
    expect(getByTestId('dynamic')).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(GasPage.metadata).toEqual({ title: 'Meme Gas', description: 'Tools' });
  });
});
