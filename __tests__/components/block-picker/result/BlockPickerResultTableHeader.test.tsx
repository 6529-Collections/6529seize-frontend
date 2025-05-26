import { render, screen } from '@testing-library/react';
import React from 'react';
import BlockPickerResultTableHeader from '../../../../components/block-picker/result/BlockPickerResultTableHeader';

describe('BlockPickerResultTableHeader', () => {
  it('renders table header with expected columns', () => {
    render(<table><BlockPickerResultTableHeader /></table>);
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent('Block includes');
    expect(headers[1]).toHaveTextContent('Count');
  });
});
