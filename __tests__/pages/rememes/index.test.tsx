import React from 'react';
import { render, screen } from '@testing-library/react';
import ReMemes from '../../../pages/rememes/index';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

describe('ReMemes page', () => {
  it('renders component and sets title', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <ReMemes />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    expect(setTitle).toHaveBeenCalledWith({ title: 'ReMemes | Collections' });
  });

  it('exposes metadata', () => {
    expect(ReMemes.metadata).toEqual({ title: 'ReMemes', description: 'Collections', ogImage: `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg` });
  });
});
