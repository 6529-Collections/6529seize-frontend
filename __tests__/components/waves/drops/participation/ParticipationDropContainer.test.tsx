import { render } from '@testing-library/react';
import ParticipationDropContainer from '../../../../../components/waves/drops/participation/ParticipationDropContainer';
import { ApiDropType } from '../../../../../generated/models/ApiDropType';
import { DropLocation } from '../../../../../components/waves/drops/Drop';

const baseDrop = { drop_type: ApiDropType.Participatory, rank: 1 } as any;

test('applies active drop styles', () => {
  const { container } = render(
    <ParticipationDropContainer drop={baseDrop} isActiveDrop={true} location={DropLocation.WAVE}>
      <div data-testid="child" />
    </ParticipationDropContainer>
  );
  const div = container.querySelector('div.tw-relative');
  expect(div?.className).toContain('tw-shadow-[inset_1px_0_0_rgba(60,203,127,0.7)]');
});

test('non-drop displays default background', () => {
  const drop = { drop_type: ApiDropType.Chat, rank: null } as any;
  const { container } = render(
    <ParticipationDropContainer drop={drop} isActiveDrop={false} location={DropLocation.MY_STREAM}>
      <div />
    </ParticipationDropContainer>
  );
  const wrapper = container.querySelector('div.tw-relative');
  expect(wrapper?.className).toContain('tw-bg-iron-950');
});
