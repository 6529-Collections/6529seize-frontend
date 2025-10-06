import React from 'react';
import { render } from '@testing-library/react';
import { TitleProvider } from '@/contexts/TitleContext';

// Mock implementation of TitleContext hooks
export const mockTitleContext = {
  title: 'Test Title',
  setTitle: jest.fn(),
  notificationCount: 0,
  setNotificationCount: jest.fn(),
  setWaveData: jest.fn(),
  setStreamHasNewItems: jest.fn(),
};

// Mock all TitleContext exports
export const mockTitleContextModule = () => {
  jest.mock('@/contexts/TitleContext', () => ({
    useTitle: () => mockTitleContext,
    useSetTitle: jest.fn(),
    useSetNotificationCount: jest.fn(),
    useSetWaveData: jest.fn(),
    useSetStreamHasNewItems: jest.fn(),
    TitleProvider: ({ children }: { children: React.ReactNode }) => children,
  }));
};

// Render with TitleProvider wrapper
export const renderWithTitleProvider = (
  component: React.ReactElement,
  mockValue?: Partial<typeof mockTitleContext>
) => {
  // Override mock values if provided
  if (mockValue) {
    Object.assign(mockTitleContext, mockValue);
  }

  return render(
    <TitleProvider>
      {component}
    </TitleProvider>
  );
};

// Reset all title mocks
export const resetTitleMocks = () => {
  mockTitleContext.setTitle.mockClear();
  mockTitleContext.setNotificationCount.mockClear();
  mockTitleContext.setWaveData.mockClear();
  mockTitleContext.setStreamHasNewItems.mockClear();
};