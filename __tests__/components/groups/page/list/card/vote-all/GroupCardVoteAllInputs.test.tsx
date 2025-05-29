import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupCardVoteAllInputs from '../../../../../../../components/groups/page/list/card/vote-all/GroupCardVoteAllInputs';
import { ApiRateMatter } from '../../../../../../../generated/models/ApiRateMatter';

jest.mock('../../../../../../../components/groups/page/list/card/utils/GroupCardActionNumberInput', () => (props: any) => (
  <div data-testid="number-input">{JSON.stringify(props)}</div>
));

jest.mock('../../../../../../../components/utils/input/rep-category/RepCategorySearch', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="rep-search">{JSON.stringify(props)}</div>,
  RepCategorySearchSize: { SM: 'SM' },
}));

describe('GroupCardVoteAllInputs', () => {
  const baseProps = {
    group: { id: 'g1' } as any,
    amountToAdd: null,
    category: null,
    creditDirection: 'ADD' as any,
    setCategory: jest.fn(),
    setAmountToAdd: jest.fn(),
    setCreditDirection: jest.fn(),
  };

  it('renders NIC input for CIC matter', () => {
    render(<GroupCardVoteAllInputs {...baseProps} matter={ApiRateMatter.Cic} />);
    expect(screen.getByTestId('number-input')).toBeInTheDocument();
    expect(screen.queryByTestId('rep-search')).toBeNull();
  });

  it('renders number input and rep search for REP matter', () => {
    render(<GroupCardVoteAllInputs {...baseProps} matter={ApiRateMatter.Rep} />);
    expect(screen.getByTestId('number-input')).toBeInTheDocument();
    expect(screen.getByTestId('rep-search')).toBeInTheDocument();
  });
});
