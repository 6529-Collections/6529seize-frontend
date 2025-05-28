import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DelegationMappingToolPage from '../../pages/delegation-mapping-tool';
import { AuthContext } from '../../components/auth/Auth';

jest.mock('next/dynamic', () => () => () => <div data-testid="dynamic" />);

const TestProvider: React.FC = ({ children }) => (
  <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>{children}</AuthContext.Provider>
);

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
