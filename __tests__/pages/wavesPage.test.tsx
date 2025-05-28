import { render } from '@testing-library/react';
import React from 'react';
import WavesPage from '../../pages/waves';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('Waves page', () => {
  it('sets title on mount', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <WavesPage />
      </AuthContext.Provider>
    );
    expect(setTitle).toHaveBeenCalledWith({ title: 'Waves | Brain' });
  });
});
