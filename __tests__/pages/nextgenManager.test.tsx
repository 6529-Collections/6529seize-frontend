import { render } from '@testing-library/react';
import React from 'react';
import NextGenAdmin from '../../pages/nextgen/manager';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('NextGen admin page', () => {
  it('sets page title and renders admin component', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <NextGenAdmin />
      </AuthContext.Provider>
    );
    expect(setTitle).toHaveBeenCalledWith({ title: 'NextGen Admin' });
  });
});
