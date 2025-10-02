import { render, screen, fireEvent } from '@testing-library/react';
import ConsolidationMappingTool from '@/components/mapping-tools/ConsolidationMappingTool';

jest.mock('@/services/6529api', () => ({ fetchAllPages: jest.fn(() => Promise.resolve([])) }));

jest.mock('csv-parser', () => () => {
  const handlers: Record<string, any> = {};
  const obj = {
    on: (event: string, cb: any) => { handlers[event] = cb; return obj; },
    write: jest.fn(),
    end: () => handlers['end'] && handlers['end'](),
  };
  return obj;
});

class MockFileReader { result: any; onload: ((ev: any) => void) | null = null; readAsText() { this.result=''; this.onload && this.onload({}); } }
Object.defineProperty(window, 'FileReader', { writable: true, value: MockFileReader });

test('selects file via drag and drop', () => {
  render(<ConsolidationMappingTool />);
  const area = screen.getByText(/Drag and drop/).parentElement as HTMLElement;
  const file = new File(['a'], 'drop.csv', { type: 'text/csv' });
  fireEvent.drop(area, { dataTransfer: { files: [file] } });
  expect(screen.getByText('drop.csv')).toBeInTheDocument();
});
