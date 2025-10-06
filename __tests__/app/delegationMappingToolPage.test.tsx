import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DelegationMappingToolPage from '@/app/delegation-mapping-tool/page';
import { AuthContext } from '@/components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

const TestProvider: React.FC = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);


// Mock TitleContext
jest.mock('@/contexts/TitleContext', () => ({
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

describe('DelegationMappingTool page', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve('<p>hello</p>'),
    }) as any;
  });

  it('renders fetched html content', async () => {
    render(
      <TestProvider>
        <DelegationMappingToolPage />
      </TestProvider>
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText('Overview')).toBeInTheDocument();
    await waitFor(() => {
      const container = document.querySelector('#how-to-use .htmlContainer') as HTMLElement;
      expect(container.innerHTML).toContain('hello');
    });
  });
});
