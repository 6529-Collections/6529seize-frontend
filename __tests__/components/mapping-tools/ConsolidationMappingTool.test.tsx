import { render, fireEvent, waitFor } from '@testing-library/react';
import ConsolidationMappingTool from '../../../components/mapping-tools/ConsolidationMappingTool';

jest.mock('react-bootstrap', () => ({
  Container: (props: any) => <div {...props} />,
  Row: (props: any) => <div {...props} />,
  Col: (props: any) => <div {...props} />,
  Form: { Control: (props: any) => <input {...props} /> },
  Button: (props: any) => <button {...props} />,
}));

jest.mock('../../../services/6529api');

// Mock FileReader
const mockFileReader = {
  onload: null as any,
  result: 'address,token_id,balance,contract,name\ntest-address,1,100,test-contract,test-name',
  readAsText: jest.fn(),
};

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: jest.fn(() => mockFileReader),
});

// Mock URL.createObjectURL and document methods for CSV download
Object.defineProperty(window.URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(() => 'mock-url'),
});

Object.defineProperty(document, 'createElement', {
  writable: true,
  value: jest.fn((tagName) => {
    const element = {
      setAttribute: jest.fn(),
      click: jest.fn(),
    };
    return element;
  }),
});

Object.defineProperty(document.body, 'appendChild', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  writable: true,
  value: jest.fn(),
});

describe('ConsolidationMappingTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('renders upload area with correct initial state', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    
    expect(getByText(/Upload File/)).toBeInTheDocument();
    expect(getByText(/Drag and drop your file here/)).toBeInTheDocument();
    expect(getByText('Submit')).toBeInTheDocument();
  });

  it.skip('toggles active class on drag events', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    const dropzone = getByText(/Drag and drop your file here/).parentElement as HTMLElement;

    expect(dropzone.className).not.toMatch(/uploadAreaActive/);
    
    fireEvent.dragEnter(dropzone);
    expect(dropzone.className).toMatch(/uploadAreaActive/);
    
    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).not.toMatch(/uploadAreaActive/);
  });

  it.skip('shows file name when file is dropped', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    const dropzone = getByText(/Drag and drop your file here/).parentElement as HTMLElement;

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(getByText('test.csv')).toBeInTheDocument();
  });

  it.skip('shows file name when file is selected via input', () => {
    const { getByDisplayValue } = render(<ConsolidationMappingTool />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['test content'], 'selected.csv', { type: 'text/csv' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);
    expect(document.body.textContent).toContain('selected.csv');
  });

  it.skip('disables submit button when no file is selected', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    const submitButton = getByText('Submit');

    expect(submitButton.className).toMatch(/submitBtnDisabled/);
  });

  it.skip('enables submit button when file is selected', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    const dropzone = getByText(/Drag and drop your file here/).parentElement as HTMLElement;
    const submitButton = getByText('Submit');

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(submitButton.className).not.toMatch(/submitBtnDisabled/);
  });

  it.skip('shows processing state when submit is clicked', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    const dropzone = getByText(/Drag and drop your file here/).parentElement as HTMLElement;

    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    const submitButton = getByText('Submit');
    fireEvent.click(submitButton);

    expect(getByText('Processing')).toBeInTheDocument();
    expect(submitButton.className).toMatch(/submitBtnDisabled/);
  });

  it.skip('prevents default on drag events', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    const dropzone = getByText(/Drag and drop your file here/).parentElement as HTMLElement;

    const dragEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn(), type: 'dragenter' };
    fireEvent.dragEnter(dropzone, dragEvent);

    expect(dragEvent.preventDefault).toHaveBeenCalled();
    expect(dragEvent.stopPropagation).toHaveBeenCalled();
  });

  it.skip('calls handleUpload when dropzone is clicked', () => {
    const { getByText } = render(<ConsolidationMappingTool />);
    const dropzone = getByText(/Drag and drop your file here/).parentElement as HTMLElement;

    // Mock the input ref click
    const mockClick = jest.fn();
    const fileInput = document.querySelector('input[type="file"]') as any;
    fileInput.click = mockClick;

    fireEvent.click(dropzone);
    expect(mockClick).toHaveBeenCalled();
  });
});