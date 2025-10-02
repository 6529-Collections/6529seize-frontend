import React from 'react';
import { render } from '@testing-library/react';
import GroupCardConfigs from '@/components/groups/page/list/card/GroupCardConfigs';
import { ApiGroupFilterDirection } from '@/generated/models/ApiGroupFilterDirection';
import { GroupDescriptionType } from '@/entities/IGroup';

jest.mock('@/components/groups/page/list/card/GroupCardConfig', () => ({ config }: any) => <div data-testid={`config-${config.key}`}>{config.value}</div>);

describe('GroupCardConfigs', () => {
  it('shows default wallets when group undefined', () => {
    const { getByTestId } = render(<GroupCardConfigs group={undefined as any} />);
    expect(getByTestId(`config-${GroupDescriptionType.WALLETS}`)).toHaveTextContent('0');
  });

  it('creates configs from group data', () => {
    const group: any = {
      group: {
        tdh: { min: 1, max: 2 },
        rep: { min: 0, max: 10, category: 'c', user_identity: 'bob', direction: ApiGroupFilterDirection.Sent },
        cic: { min: null, max: 5, user_identity: null, direction: null },
        level: { min: 3, max: 4 },
        identity_group_identities_count: 7,
      },
    };
    const { getByTestId } = render(<GroupCardConfigs group={group} />);
    expect(getByTestId(`config-${GroupDescriptionType.TDH}`)).toHaveTextContent('1 - 2');
    expect(getByTestId(`config-${GroupDescriptionType.REP}`)).toHaveTextContent('0 - 10, category: c, to identity: bob');
    expect(getByTestId(`config-${GroupDescriptionType.NIC}`)).toHaveTextContent('<= 5');
    expect(getByTestId(`config-${GroupDescriptionType.LEVEL}`)).toHaveTextContent('3 - 4');
    expect(getByTestId(`config-${GroupDescriptionType.WALLETS}`)).toHaveTextContent('7');
  });
});
