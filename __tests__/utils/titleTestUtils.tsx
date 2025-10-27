import type { ReactNode } from 'react';

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
    TitleProvider: ({ children }: { children: ReactNode }) => children,
  }));
};
