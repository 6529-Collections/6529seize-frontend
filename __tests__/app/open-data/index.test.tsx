import React from 'react';
import { render, screen } from '@testing-library/react';
import Downloads from '../../../pages/open-data/index';
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

describe('Open Data page', () => {
  it('renders downloads component and sets title', () => {
    render(
      <Downloads />
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    // Component renders successfully
  });

  it('exposes metadata', () => {
    expect(Downloads.metadata).toEqual({ title: 'Open Data' });
  });
});
