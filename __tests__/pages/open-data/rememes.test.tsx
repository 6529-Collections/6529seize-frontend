import React from 'react';
import { render, screen } from '@testing-library/react';
import RememesDownloads from '../../../pages/open-data/rememes';
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

describe('Open Data rememes page', () => {
  it('renders component and sets title', () => {
    render(
      <RememesDownloads />
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
  });

  it('exposes metadata', () => {
    expect(RememesDownloads.metadata).toEqual({ title: 'Rememes', description: 'Open Data' });
  });
});
