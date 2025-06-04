import { render, screen, fireEvent } from '@testing-library/react';
import BlockPickerBlockNumberIncludes from '../../../components/block-picker/BlockPickerBlockNumberIncludes';

describe('BlockPickerBlockNumberIncludes', () => {
  it('renders with provided value', () => {
    render(
      <BlockPickerBlockNumberIncludes blockNumberIncludes="42" setBlockNumberIncludes={() => {}} />
    );
    const input = screen.getByPlaceholderText('e.g. 42, 69, 42069, 6529') as HTMLInputElement;
    expect(input.value).toBe('42');
  });

  it('calls setBlockNumberIncludes on change', () => {
    const setValue = jest.fn();
    render(
      <BlockPickerBlockNumberIncludes blockNumberIncludes="" setBlockNumberIncludes={setValue} />
    );
    const input = screen.getByPlaceholderText('e.g. 42, 69, 42069, 6529');
    fireEvent.change(input, { target: { value: '69' } });
    expect(setValue).toHaveBeenCalledWith('69');
  });
});
