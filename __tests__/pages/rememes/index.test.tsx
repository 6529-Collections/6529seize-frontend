import React from 'react';
import { render, screen } from '@testing-library/react';
import ReMemes from '../../../pages/rememes/index';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

// Mock TitleContext
jest.mock('../../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: jest.fn(),
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: jest.fn(),
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ReMemes page', () => {
  it('renders component', () => {
    render(
      <AuthContext.Provider value={{} as any}>
        <ReMemes />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('exposes metadata', () => {
    expect(ReMemes.metadata).toEqual({ title: 'ReMemes', description: 'Collections', ogImage: `${process.env.BASE_ENDPOINT}/re-memes-b.jpeg` });
  });
});
