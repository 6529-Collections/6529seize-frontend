import { render } from '@testing-library/react';
import WaveGroupEdit from '@/components/waves/specs/groups/group/edit/WaveGroupEdit';
import { WaveGroupType } from '@/components/waves/specs/groups/group/WaveGroup';
import { convertWaveToUpdateWave } from '@/helpers/waves/waves.helpers';

let triggerSelect: (g: any) => void;
jest.mock('@/components/utils/select-group/SelectGroupModalWrapper', () => (props: any) => {
  triggerSelect = props.onGroupSelect;
  return null;
});

jest.mock('@/helpers/waves/waves.helpers');

(convertWaveToUpdateWave as jest.Mock).mockReturnValue({
  visibility: { scope: {} },
  participation: { scope: {} },
  voting: { scope: {} },
  chat: { scope: {} },
  wave: { admin_group: {} },
});

type Body = ReturnType<typeof convertWaveToUpdateWave>;

it('builds body according to type', () => {
  const onEdit = jest.fn();
  render(
    <WaveGroupEdit wave={{} as any} type={WaveGroupType.VIEW} isEditOpen={true} setIsEditOpen={jest.fn()} onEdit={onEdit} />
  );
  triggerSelect({ id: 'g1' });
  const bodyView = onEdit.mock.calls[0][0] as Body;
  expect(bodyView.visibility.scope.group_id).toBe('g1');

  onEdit.mockClear();
  render(
    <WaveGroupEdit wave={{} as any} type={WaveGroupType.ADMIN} isEditOpen={true} setIsEditOpen={jest.fn()} onEdit={onEdit} />
  );
  triggerSelect({ id: 'g2' });
  const bodyAdmin = onEdit.mock.calls[0][0] as any;
  expect(bodyAdmin.wave.admin_group.group_id).toBe('g2');
});
