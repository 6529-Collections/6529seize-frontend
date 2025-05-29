import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SelectGroupModalSearchName from '../../components/utils/select-group/SelectGroupModalSearchName';

describe('SelectGroupModalSearchName', () => {
  it('calls setFilterName on input', () => {
    const mock = jest.fn();
    render(<SelectGroupModalSearchName filterName={null} setFilterName={mock} />);
    const input = screen.getByLabelText('Search by group name');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(mock).toHaveBeenCalledWith('abc');
  });
});
