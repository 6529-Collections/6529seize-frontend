import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsolidationMappingTool from '../../../components/mapping-tools/ConsolidationMappingTool';
import { fetchAllPages } from '../../../services/6529api';

jest.mock('../../../services/6529api', () => ({ fetchAllPages: jest.fn(() => Promise.resolve([])) }));

jest.mock('csv-parser', () => () => {
  const handlers: Record<string, any> = {};
  const obj = {
    on: (event: string, cb: any) => { handlers[event] = cb; return obj; },
    write: jest.fn(),
    end: () => handlers['end'] && handlers['end'](),
  };
  return obj;
});

class MockFileReader {
  result: any;
  onload: ((ev: any) => void) | null = null;
  readAsText() { this.result = ''; this.onload && this.onload({}); }
}
Object.defineProperty(window, 'FileReader', { writable: true, value: MockFileReader });

describe('ConsolidationMappingTool', () => {
  it('shows selected file and triggers processing', async () => {
    render(<ConsolidationMappingTool />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['a'], 'test.csv', { type: 'text/csv' });
    await userEvent.upload(input, file);
    expect(screen.getByText('test.csv')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(button);
    expect(button).toHaveTextContent(/processing/i);
    await waitFor(() => expect(fetchAllPages).toHaveBeenCalled());
  });
});
