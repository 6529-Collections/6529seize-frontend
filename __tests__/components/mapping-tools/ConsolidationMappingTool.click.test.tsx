import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConsolidationMappingTool from '../../../components/mapping-tools/ConsolidationMappingTool';

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

class MockFileReader { result: any; onload: ((ev: any) => void) | null = null; readAsText() { this.result=''; this.onload && this.onload({}); } }
Object.defineProperty(window, 'FileReader', { writable: true, value: MockFileReader });

describe('ConsolidationMappingTool upload click', () => {
  it('triggers file input click when area clicked', async () => {
    const user = userEvent.setup();
    const spy = jest.spyOn(HTMLInputElement.prototype, 'click');
    render(<ConsolidationMappingTool />);
    const area = screen.getByText(/Drag and drop/).parentElement as HTMLElement;
    await user.click(area);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
