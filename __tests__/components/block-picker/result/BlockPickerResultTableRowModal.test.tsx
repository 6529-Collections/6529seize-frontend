import React from 'react';
import { render, screen } from '@testing-library/react';
import BlockPickerResultTableRowModal from '../../../../components/block-picker/result/BlockPickerResultTableRowModal';

jest.mock('../../../../components/block-picker/advanced/BlockPickerAdvancedItemBlock', () => ({ block, blockParts }: any) => (
  <div data-testid="block" data-block={block}>{blockParts}</div>
));

describe('BlockPickerResultTableRowModal', () => {
  it('shows blocks information', () => {
    const predictedBlock = {
      blockNumberIncludes: 42,
      count: 2,
      blockNumbers: [100, 101],
    } as any;

    render(<BlockPickerResultTableRowModal predictedBlock={predictedBlock} />);

    expect(screen.getByText('Blocks that include 42')).toBeInTheDocument();
    expect(screen.getByText('Total: 2')).toBeInTheDocument();
    const blocks = screen.getAllByTestId('block');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toHaveAttribute('data-block', '100');
  });

  it('uses singular when count is one', () => {
    const predictedBlock = { blockNumberIncludes: 7, count: 1, blockNumbers: [7] } as any;
    render(<BlockPickerResultTableRowModal predictedBlock={predictedBlock} />);
    expect(screen.getByText('Block that includes 7')).toBeInTheDocument();
  });
});
