jest.mock("next/font/google", () => ({ Poppins: () => () => ({}) }));
import { render, screen, fireEvent } from '@testing-library/react';
import BlockPickerTimeWindowSelectList from '../../../components/block-picker/BlockPickerTimeWindowSelectList';
import { BlockPickerTimeWindow } from '../../../pages/meme-blocks';

describe('BlockPickerTimeWindowSelectList', () => {
  const options = [
    { title: 'None', value: BlockPickerTimeWindow.NONE },
    { title: '1 minute', value: BlockPickerTimeWindow.ONE_MINUTE },
  ];

  it('renders options and highlights selected one', () => {
    const setTimeWindow = jest.fn();
    render(
      <BlockPickerTimeWindowSelectList
        options={options}
        timeWindow={BlockPickerTimeWindow.ONE_MINUTE}
        setTimeWindow={setTimeWindow}
      />
    );
    expect(screen.getByText('None')).toBeInTheDocument();
    const selectedItem = screen.getByText('1 minute').closest('li')!;
    expect(selectedItem.querySelector('svg')).toBeInTheDocument();
  });

  it('calls setTimeWindow when option clicked', () => {
    const setTimeWindow = jest.fn();
    render(
      <BlockPickerTimeWindowSelectList
        options={options}
        timeWindow={BlockPickerTimeWindow.NONE}
        setTimeWindow={setTimeWindow}
      />
    );
    const optionItem = screen.getByText('1 minute').closest('li')!;
    fireEvent.click(optionItem);
    expect(setTimeWindow).toHaveBeenCalledWith(BlockPickerTimeWindow.ONE_MINUTE);
  });
});
