import { render, fireEvent } from '@testing-library/react';
import DelegationMappingTool from '../../../components/mapping-tools/DelegationMappingTool';

jest.mock('react-bootstrap', () => ({
  Container: (props: any) => <div {...props} />,
  Row: (props: any) => <div {...props} />,
  Col: (props: any) => <div {...props} />,
  Form: { Select: (props: any) => <select {...props} />, Control: (props: any) => <input {...props} /> },
  Button: (props: any) => <button {...props} />,
}));

describe('DelegationMappingTool drag and drop', () => {
  it('toggles active class on drag events and shows file name on drop', () => {
    const { getByText } = render(<DelegationMappingTool />);
    const textElement = getByText(/drag and drop/i);
    const dropzone = textElement.parentElement as HTMLElement;

    expect(dropzone.className).not.toMatch(/uploadAreaActive/);
    fireEvent.dragEnter(dropzone);
    expect(dropzone.className).toMatch(/uploadAreaActive/);
    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).not.toMatch(/uploadAreaActive/);

    const file = new File(['a'], 'test.csv', { type: 'text/csv' });
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(dropzone.textContent).toContain('test.csv');
  });
});
