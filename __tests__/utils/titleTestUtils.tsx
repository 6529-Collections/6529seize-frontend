import type { ReactNode } from 'react';

// Mock implementation of TitleContext hooks
const mockTitleContext = {
  title: 'Test Title',
  setTitle: jest.fn(),
  notificationCount: 0,
  setNotificationCount: jest.fn(),
  setWaveData: jest.fn(),
};

// Mock all TitleContext exports
export const mockTitleContextModule = () => {
  jest.mock('@/contexts/TitleContext', () => ({
    useTitle: () => mockTitleContext,
    useSetTitle: jest.fn(),
    useSetWaveData: jest.fn(),
    TitleProvider: ({ children }: { children: ReactNode }) => children,
  }));
};
