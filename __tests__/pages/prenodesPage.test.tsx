import React from 'react';
import PrenodesPage from '../../pages/network/prenodes';
import { renderWithAuth } from '../utils/testContexts';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);


// Mock TitleContext
const mockSetTitle = jest.fn();
jest.mock('../../contexts/TitleContext', () => ({
  useTitle: () => ({
    title: 'Test Title',
    setTitle: mockSetTitle,
    notificationCount: 0,
    setNotificationCount: jest.fn(),
    setWaveData: jest.fn(),
    setStreamHasNewItems: jest.fn(),
  }),
  useSetTitle: () => mockSetTitle,
  useSetNotificationCount: jest.fn(),
  useSetWaveData: jest.fn(),
  useSetStreamHasNewItems: jest.fn(),
  TitleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('prenodes page', () => {
  it('renders Prenodes page', () => {
    const mockAuthContext = {};
    
    renderWithAuth(<PrenodesPage />, mockAuthContext);
    // Component renders successfully with TitleContext
  });

  it('has correct metadata', () => {
    expect(PrenodesPage.metadata).toEqual({
      title: "Prenodes",
      description: "Network",
    });
  });
});