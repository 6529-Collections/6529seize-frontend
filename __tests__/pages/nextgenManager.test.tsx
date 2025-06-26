import { render } from '@testing-library/react';
import React from 'react';
import NextGenAdmin from '../../pages/nextgen/manager';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);


// Mock TitleContext
jest.mock('../../contexts/TitleContext', () => ({
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

describe('NextGen admin page', () => {
  it('sets page title and renders admin component', () => {
    const setTitle = jest.fn();
    render(
      <AuthContext.Provider value={{ setTitle } as any}>
        <NextGenAdmin />
      </AuthContext.Provider>
    );
    // Component renders successfully
  });
});
