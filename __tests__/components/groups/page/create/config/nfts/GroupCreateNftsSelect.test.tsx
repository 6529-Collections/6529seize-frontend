import React from 'react';
import { render, screen } from '@testing-library/react';
import GroupCreateNftsSelect from '../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftsSelect';
import { ApiGroupOwnsNftNameEnum } from '../../../../../../../generated/models/ApiGroupOwnsNft';

let searchProps: any = null;

jest.mock('../../../../../../../components/groups/page/create/config/nfts/GroupCreateNftSearch', () => ({
  __esModule: true,
  default: (props: any) => { searchProps = props; return <div data-testid="search"/>; }
}));

describe('GroupCreateNftsSelect', () => {
  beforeEach(() => {
    searchProps = null;
  });

  it('passes props to GroupCreateNftSearch', () => {
    const onSelect = jest.fn();
    const selected = [{ name: ApiGroupOwnsNftNameEnum.Gradients, tokens: ['1'] }];
    render(<GroupCreateNftsSelect selected={selected} onSelect={onSelect} />);
    expect(searchProps).toEqual({ selected, onSelect });
    expect(screen.getByTestId('search')).toBeInTheDocument();
  });
});
