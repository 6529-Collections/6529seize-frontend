import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import BlockPickerBlockNumberIncludes from '../../../components/block-picker/BlockPickerBlockNumberIncludes';

describe('BlockPickerBlockNumberIncludes', () => {
  it('renders input and updates value', async () => {
    function Wrapper() {
      const [val, setVal] = useState('');
      return (
        <BlockPickerBlockNumberIncludes
          blockNumberIncludes={val}
          setBlockNumberIncludes={setVal}
        />
      );
    }
    render(<Wrapper />);
    const input = screen.getByPlaceholderText('e.g. 42, 69, 42069, 6529');
    await userEvent.type(input, '123');
    expect((input as HTMLInputElement).value).toBe('123');
  });
});
