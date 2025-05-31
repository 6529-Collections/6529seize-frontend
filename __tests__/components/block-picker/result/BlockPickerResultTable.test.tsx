import React from 'react';
import { render } from '@testing-library/react';
import BlockPickerResultTable from '../../../../components/block-picker/result/BlockPickerResultTable';

let rowProps: any[] = [];
jest.mock('../../../../components/block-picker/result/BlockPickerResultTableRow', () => (props: any) => { rowProps.push(props); return <tr data-testid="row" />; });
jest.mock('../../../../components/block-picker/result/BlockPickerResultTableHeader', () => () => <thead data-testid="header" />);

describe('BlockPickerResultTable', () => {
  beforeEach(() => { rowProps = []; });
  it('renders header and rows', () => {
    const data = [
      { blockNumberIncludes: 1, count: 2 },
      { blockNumberIncludes: 2, count: 3 },
    ];
    const { getByTestId, getAllByTestId } = render(
      <BlockPickerResultTable predictedBlocks={data as any} />
    );
    expect(getByTestId('header')).toBeInTheDocument();
    expect(getAllByTestId('row')).toHaveLength(2);
    expect(rowProps[0].predictedBlock).toEqual(data[0]);
  });
});
