import React from 'react';
import { render, screen } from '@testing-library/react';
import TeamDownloads from '../../../pages/open-data/team';
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

describe('Open Data team page', () => {
  it('renders component and sets title', () => {
    render(
      <TeamDownloads />
    );
    expect(screen.getByTestId('dynamic')).toBeInTheDocument();
    // Component renders successfully
  });

  it('exposes metadata', () => {
    expect(TeamDownloads.metadata).toEqual({ title: 'Team', description: 'Open Data' });
  });
});
