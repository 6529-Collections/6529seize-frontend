import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { printVolumeTypeDropdown, SortButton } from '../../../components/the-memes/TheMemes';
import { VolumeType, NFTWithMemesExtendedData } from '../../../entities/INFT';
import { MemesSort, MemeLabSort } from '../../../enums';
import { SortDirection } from '../../../entities/ISort';

// Mock styles modules used by SortButton/Dropdown for simplicity
jest.mock('../../../components/the-memes/TheMemes.module.scss', () => ({
  volumeDropdown: 'volumeDropdown',
  volumeDropdownEnabled: 'volumeDropdownEnabled',
  sort: 'sort',
  disabled: 'disabled',
  sortDirection: 'sortDirection'
}));

describe('TheMemes helpers', () => {
  it('renders volume type dropdown and handles selection', async () => {
    const setVolumeType = jest.fn();
    const setVolumeSort = jest.fn();
    render(printVolumeTypeDropdown(false, setVolumeType, setVolumeSort));

    const dropdownButton = screen.getByRole('button');
    await userEvent.click(dropdownButton);
    const item = screen.getByText(VolumeType.DAYS_7);
    await userEvent.click(item);
    expect(setVolumeType).toHaveBeenCalledWith(VolumeType.DAYS_7);
    expect(setVolumeSort).toHaveBeenCalled();
  });

  it('sort button calls select and applies disabled style', async () => {
    const select = jest.fn();
    render(
      <SortButton currentSort={MemesSort.AGE} sort={MemeLabSort.VOLUME} select={select} />
    );
    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(select).toHaveBeenCalled();
    expect(btn.className).toContain('disabled');
  });
});
