// @ts-nocheck
import { render } from '@testing-library/react';
import React from 'react';
import GroupCreateTDH from '@/components/groups/page/create/config/GroupCreateTDH';
import { ApiGroupTdhInclusionStrategy } from '@/generated/models/ApiGroupTdhInclusionStrategy';

jest.mock('@/components/groups/page/create/config/common/GroupCreateNumericValue', () => ({
  __esModule: true,
  default: (props: any) => { mockProps = props; return <div data-testid="numeric" />; }
}));

let mockProps: any = null;

describe('GroupCreateTDH', () => {
  it('passes value and setValue to GroupCreateNumericValue', () => {
    const setTDH = jest.fn();
    const tdh = { min: 3, inclusion_strategy: ApiGroupTdhInclusionStrategy.Tdh } as any;
    const { getByTestId } = render(<GroupCreateTDH tdh={tdh} setTDH={setTDH} />);
    expect(getByTestId('numeric')).toBeInTheDocument();
    expect(mockProps.value).toBe(3);
    expect(mockProps.label).toBe('TDH at least');
    mockProps.setValue(7);
    expect(setTDH).toHaveBeenCalledWith({ ...tdh, min: 7 });
  });
});
