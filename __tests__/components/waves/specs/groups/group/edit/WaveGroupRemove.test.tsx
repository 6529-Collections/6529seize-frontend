import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import WaveGroupRemove from '@/components/waves/specs/groups/group/edit/WaveGroupRemove';
import { WaveGroupType } from '@/components/waves/specs/groups/group/WaveGroup';
import { convertWaveToUpdateWave } from '@/helpers/waves/waves.helpers';

jest.mock('@/components/waves/specs/groups/group/edit/WaveGroupRemoveModal', () => (props: any) => (
  <button data-testid="remove" onClick={props.removeGroup}>remove</button>
));
jest.mock('@/components/utils/animation/CommonAnimationWrapper', () => (props: any) => <div>{props.children}</div>);
jest.mock('@/components/utils/animation/CommonAnimationOpacity', () => (props: any) => <div onClick={props.onClicked}>{props.children}</div>);
jest.mock('@/helpers/waves/waves.helpers');

(convertWaveToUpdateWave as jest.Mock).mockImplementation((wave: any) => ({
  visibility: { scope: { group_id: wave.visibility.scope.group.id } },
  participation: { scope: { group_id: wave.participation.scope.group.id } },
  voting: { scope: { group_id: wave.voting.scope.group.id } },
  chat: { scope: { group_id: wave.chat.scope.group.id } },
  wave: { admin_group: { group_id: wave.wave.admin_group.group.id } },
}));

describe('WaveGroupRemove', () => {
  const baseWave: any = {
    visibility: { scope: { group: { id: 'vis' } } },
    participation: { scope: { group: { id: 'part' } } },
    voting: { scope: { group: { id: 'vote' } } },
    chat: { scope: { group: { id: 'chat' } } },
    wave: { admin_group: { group: { id: 'admin' } } },
  };

  it('builds body according to type', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn(() => Promise.resolve());
    render(
      <WaveGroupRemove wave={baseWave} type={WaveGroupType.VIEW} isEditOpen={true} setIsEditOpen={jest.fn()} onEdit={onEdit} />
    );
    await user.click(screen.getByTestId('remove'));
    expect(onEdit).toHaveBeenCalled();
    expect(onEdit.mock.calls[0][0].visibility.scope.group_id).toBeNull();

    onEdit.mockClear();
    render(
      <WaveGroupRemove wave={baseWave} type={WaveGroupType.ADMIN} isEditOpen={true} setIsEditOpen={jest.fn()} onEdit={onEdit} />
    );
    await user.click(screen.getAllByTestId('remove')[1]);
    expect(onEdit.mock.calls[0][0].wave.admin_group.group_id).toBeNull();
  });
});
