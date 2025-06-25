import React from 'react';
import { render, screen } from '@testing-library/react';
import LevelsPage from '../../../pages/network/levels';
import { AuthContext } from '../../../components/auth/Auth';

jest.mock('../../../components/levels/ProgressChart', () => () => <div data-testid="progress-chart" />);
jest.mock('../../../components/levels/TableOfLevels', () => () => <div data-testid="table-of-levels" />);


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

describe('LevelsPage', () => {
  it('sets title and renders components', () => {
    render(
      <LevelsPage />
    );
    // Component renders successfully
    expect(screen.getByText('Levels')).toBeInTheDocument();
    expect(screen.getByTestId('progress-chart')).toBeInTheDocument();
    expect(screen.getByTestId('table-of-levels')).toBeInTheDocument();
  });

  it('exports metadata', () => {
    expect(LevelsPage.metadata).toEqual({ title: 'Levels', description: 'Network' });
  });
});
