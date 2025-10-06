import { render, screen } from '@testing-library/react';
import React from 'react';
import BlockPickerResult from '@/components/block-picker/result/BlockPickerResult';

jest.mock('@/components/block-picker/result/BlockPickerResultHeader', () => () => <div data-testid="header"/>);
jest.mock('@/components/block-picker/result/BlockPickerResultTable', () => (props: any) => <div data-testid="table" data-count={props.predictedBlocks.length}/>);

describe('BlockPickerResult', () => {
  it('shows table when blocks present', () => {
    render(<BlockPickerResult blocknumber={1} timestamp={1} predictedBlocks={[{ blockNumberIncludes: 1 } as any]} />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('table')).toHaveAttribute('data-count', '1');
  });

  it('hides table when none', () => {
    render(<BlockPickerResult blocknumber={1} timestamp={1} predictedBlocks={[]} />);
    expect(screen.queryByTestId('table')).toBeNull();
  });
});
