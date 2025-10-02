import { render, screen } from '@testing-library/react';
import React from 'react';
import BlockPickerResultHeader from '@/components/block-picker/result/BlockPickerResultHeader';

jest.mock('@/components/distribution-plan-tool/common/Countdown', () => ({ __esModule: true, default: (props: any) => <div data-testid="countdown">{props.timestamp}</div> }));

describe('BlockPickerResultHeader', () => {
  it('renders block number and formatted date', () => {
    const { getByText } = render(<BlockPickerResultHeader timestamp={1000} blocknumber={12} />);
    expect(getByText('12')).toBeInTheDocument();
    expect(screen.getByTestId('countdown')).toHaveTextContent('1000');
    expect(getByText(/is the closest predicted block/)).toBeInTheDocument();
  });
});
