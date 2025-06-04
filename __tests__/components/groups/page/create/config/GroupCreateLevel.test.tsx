// @ts-nocheck
import { render } from '@testing-library/react';
import React from 'react';
import GroupCreateLevel from '../../../../../../components/groups/page/create/config/GroupCreateLevel';

jest.mock('../../../../../../components/groups/page/create/config/common/GroupCreateNumericValue', () => ({
  __esModule: true,
  default: (props: any) => {
    mockProps = props;
    return <div data-testid="numeric" />;
  }
}));

let mockProps: any = null;

describe('GroupCreateLevel', () => {
  it('passes value and setValue to GroupCreateNumericValue', () => {
    const setLevel = jest.fn();
    const level = { min: 2 } as any;
    const { getByTestId } = render(<GroupCreateLevel level={level} setLevel={setLevel} />);
    expect(getByTestId('numeric')).toBeInTheDocument();
    expect(mockProps.value).toBe(2);
    expect(mockProps.label).toBe('Level at least');
    mockProps.setValue(5);
    expect(setLevel).toHaveBeenCalledWith({ ...level, min: 5 });
  });
});
