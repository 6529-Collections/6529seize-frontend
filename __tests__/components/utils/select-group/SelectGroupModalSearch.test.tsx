import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SelectGroupModalSearch from '@/components/utils/select-group/SelectGroupModalSearch';

jest.mock('@/components/utils/input/identity/IdentitySearch', () => ({ __esModule: true, default: (props: any) => <button data-testid="identity" onClick={() => props.setIdentity('user')}>{props.identity}</button>, IdentitySearchSize: { SM: 'SM' } }));
jest.mock('@/components/utils/select-group/SelectGroupModalSearchName', () => ({ __esModule: true, default: (props: any) => <button data-testid="name" onClick={() => props.setFilterName('name')}>{props.filterName}</button> }));

describe('SelectGroupModalSearch', () => {
  it('passes values to child components', () => {
    const onUserSelect = jest.fn();
    const onFilterNameSearch = jest.fn();
    render(
      <SelectGroupModalSearch groupName="g" groupUser="u" onUserSelect={onUserSelect} onFilterNameSearch={onFilterNameSearch} />
    );
    expect(screen.getByTestId('identity')).toHaveTextContent('u');
    expect(screen.getByTestId('name')).toHaveTextContent('g');
    fireEvent.click(screen.getByTestId('identity'));
    fireEvent.click(screen.getByTestId('name'));
    expect(onUserSelect).toHaveBeenCalledWith('user');
    expect(onFilterNameSearch).toHaveBeenCalledWith('name');
  });
});
