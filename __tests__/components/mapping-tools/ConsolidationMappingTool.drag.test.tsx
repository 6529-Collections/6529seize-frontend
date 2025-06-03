import { render, screen, fireEvent } from '@testing-library/react';
import ConsolidationMappingTool from '../../../components/mapping-tools/ConsolidationMappingTool';

jest.mock('../../../services/6529api', () => ({ fetchAllPages: jest.fn(() => Promise.resolve([])) }));

jest.mock('csv-parser', () => () => ({ on: () => {}, write: () => {}, end: () => {} }));

class MockFileReader { result: any; onload: ((ev: any) => void) | null = null; readAsText() { this.result=''; this.onload && this.onload({}); } }
Object.defineProperty(window, 'FileReader', { writable: true, value: MockFileReader });

test('drag events toggle active class', () => {
  render(<ConsolidationMappingTool />);
  const area = screen.getByText(/Drag and drop/).parentElement as HTMLElement;
  fireEvent.dragEnter(area, { dataTransfer: { files: [] } });
  expect(area.className).toContain('uploadAreaActive');
  fireEvent.dragLeave(area, { dataTransfer: { files: [] } });
  expect(area.className).not.toContain('uploadAreaActive');
});
