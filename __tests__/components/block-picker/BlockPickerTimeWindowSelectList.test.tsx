import { render, screen, fireEvent, within } from '@testing-library/react';
jest.mock('../../../pages/meme-blocks', () => ({
  BlockPickerTimeWindow: {
    ONE_MINUTE: 'ONE_MINUTE',
    FIVE_MINUTES: 'FIVE_MINUTES'
  }
}));

import BlockPickerTimeWindowSelectList from '../../../components/block-picker/BlockPickerTimeWindowSelectList';
import { BlockPickerTimeWindow } from '../../../pages/meme-blocks';

describe('BlockPickerTimeWindowSelectList', () => {
  const options = [
    { title: '1m', value: BlockPickerTimeWindow.ONE_MINUTE },
    { title: '5m', value: BlockPickerTimeWindow.FIVE_MINUTES },
  ];

  it('renders options and highlights the active one', () => {
    const setTimeWindow = jest.fn();
    const { container } = render(
      <BlockPickerTimeWindowSelectList
        options={options}
        timeWindow={BlockPickerTimeWindow.ONE_MINUTE}
        setTimeWindow={setTimeWindow}
      />
    );

    const items = screen.getAllByRole('option');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('1m')).toBeInTheDocument();
    expect(within(items[1]).getByText('5m')).toBeInTheDocument();
    expect(items[0].querySelector('svg')).toBeInTheDocument();
    expect(items[1].querySelector('svg')).toBeNull();
  });

  it('calls setTimeWindow when option clicked', () => {
    const setTimeWindow = jest.fn();
    render(
      <BlockPickerTimeWindowSelectList
        options={options}
        timeWindow={BlockPickerTimeWindow.ONE_MINUTE}
        setTimeWindow={setTimeWindow}
      />
    );
    const items = screen.getAllByRole('option');
    fireEvent.click(items[1]);
    expect(setTimeWindow).toHaveBeenCalledWith(BlockPickerTimeWindow.FIVE_MINUTES);
  });
});
