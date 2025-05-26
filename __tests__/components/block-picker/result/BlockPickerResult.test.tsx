import { render, screen } from '@testing-library/react';
import BlockPickerResult from '../../../../components/block-picker/result/BlockPickerResult';

jest.mock('../../../../components/block-picker/result/BlockPickerResultHeader', () => (props: any) => (
  <div data-testid="header">{`${props.blocknumber}-${props.timestamp}`}</div>
));

jest.mock('../../../../components/block-picker/result/BlockPickerResultTable', () => (props: any) => (
  <div data-testid="table">{props.predictedBlocks.length}</div>
));

describe('BlockPickerResult', () => {
  const blocknumber = 123;
  const timestamp = 456;

  it('renders header and no table for empty results', () => {
    render(
      <BlockPickerResult blocknumber={blocknumber} timestamp={timestamp} predictedBlocks={[]} />
    );
    expect(screen.getByTestId('header')).toHaveTextContent(`${blocknumber}-${timestamp}`);
    expect(screen.queryByTestId('table')).not.toBeInTheDocument();
  });

  it('renders table when predicted blocks exist', () => {
    const predictedBlocks = [{ blockNumberIncludes: 1, count: 2, blockNumbers: [1, 2] }];
    render(
      <BlockPickerResult
        blocknumber={blocknumber}
        timestamp={timestamp}
        predictedBlocks={predictedBlocks}
      />
    );
    expect(screen.getByTestId('table')).toHaveTextContent('1');
  });
});
