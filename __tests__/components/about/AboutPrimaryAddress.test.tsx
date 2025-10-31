import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import AboutPrimaryAddress from '@/components/about/AboutPrimaryAddress';

jest.mock('csv-parser', () => {
  return () => {
    const handlers: Record<string, Array<(...args: any[]) => void>> = {};
    const parser = {
      on(event: string, cb: (...args: any[]) => void) {
        handlers[event] = handlers[event] || [];
        handlers[event].push(cb);
        return parser;
      },
      write(data: string) {
        const lines = data.split(/\r?\n/).filter(Boolean);
        for (const line of lines) {
          const values = line.split(',');
          const row: Record<string, string> = {};
          values.forEach((v, i) => {
            row[String(i)] = v;
          });
          handlers['data']?.forEach(fn => fn(row));
        }
        return parser;
      },
      end() {
        handlers['end']?.forEach(fn => fn());
        return parser;
      },
    };
    return parser;
  };
});

describe('AboutPrimaryAddress', () => {
  const csv = '2,beta,bcur,bnew\n1,alpha,acur,anew';
  const originalFetch = global.fetch;
  let queryClient: QueryClient;
  const renderWithQueryClient = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AboutPrimaryAddress />
      </QueryClientProvider>
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(csv),
    }) as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('fetches csv and displays sorted table', async () => {
    renderWithQueryClient();
    await waitFor(() => {
      expect(screen.getByText('alpha')).toBeInTheDocument();
    });
    const rows = screen.getAllByRole('row');
    // first row is header
    expect(rows[1]).toHaveTextContent('alpha');
    expect(rows[2]).toHaveTextContent('beta');
  });
});
