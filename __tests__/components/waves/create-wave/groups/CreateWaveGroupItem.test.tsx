import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveGroupItem from '../../../../../components/waves/create-wave/groups/CreateWaveGroupItem';
import { CreateWaveGroupStatus } from '../../../../../types/waves.types';

const sampleGroup = {
  id: '1',
  name: 'Group One',
  group: {} as any,
  created_at: 0,
  created_by: { handle: 'alice', pfp: 'img.png' },
  visible: true,
  is_private: false,
};

describe('CreateWaveGroupItem', () => {
  it('renders group info and triggers onSelectedClick', async () => {
    const onSelectedClick = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveGroupItem
        selectedGroup={sampleGroup as any}
        switchSelected={jest.fn()}
        onSelectedClick={onSelectedClick}
      />
    );
    await user.click(screen.getByRole('radio'));
    expect(onSelectedClick).toHaveBeenCalled();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('Group One')).toBeInTheDocument();
  });

  it('shows placeholder label when no group selected', async () => {
    const switchSelected = jest.fn();
    const user = userEvent.setup();
    render(
      <CreateWaveGroupItem
        selectedGroup={null}
        switchSelected={switchSelected}
        onSelectedClick={jest.fn()}
      />
    );
    await user.click(screen.getByRole('radio'));
    expect(switchSelected).toHaveBeenCalledWith(CreateWaveGroupStatus.GROUP);
    expect(screen.getByText('A Group')).toBeInTheDocument();
  });
});
