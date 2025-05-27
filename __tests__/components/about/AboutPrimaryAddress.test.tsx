import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AboutPrimaryAddress from '../../../components/about/AboutPrimaryAddress';

jest.mock('csv-parser', () => {
  return () => {
    const handlers: Record<string, Function[]> = {};
    const parser = {
      on(event: string, cb: Function) {
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
      }
    };
    return parser;
  };
});

describe('AboutPrimaryAddress', () => {
  const csv = '2,beta,bcur,bnew\n1,alpha,acur,anew';

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob([csv]))
    });
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: null | (() => void) = null;
      readAsText(_blob: Blob) {
        this.result = csv;
        this.onload && this.onload();
      }
    }
    // @ts-ignore
    global.FileReader = MockFileReader;
  });

  it('fetches csv and displays sorted table', async () => {
    render(<AboutPrimaryAddress />);
    await waitFor(() => {
      expect(screen.getByText('alpha')).toBeInTheDocument();
    });
    const rows = screen.getAllByRole('row');
    // first row is header
    expect(rows[1]).toHaveTextContent('alpha');
    expect(rows[2]).toHaveTextContent('beta');
  });
});
