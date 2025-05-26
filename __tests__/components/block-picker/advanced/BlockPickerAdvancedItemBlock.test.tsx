import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';

const mockCopy = jest.fn();
jest.mock('react-use', () => ({
  useCopyToClipboard: () => [{}, mockCopy],
}));

import BlockPickerAdvancedItemBlock from '../../../../components/block-picker/advanced/BlockPickerAdvancedItemBlock';

jest.useFakeTimers();

describe('BlockPickerAdvancedItemBlock', () => {
  it('highlights matching block parts', () => {
    render(<BlockPickerAdvancedItemBlock block={12323} blockParts={23} />);
    const spans = screen.getAllByText('23');
    // should highlight each occurrence with span element
    spans.forEach((span) => expect(span.tagName).toBe('SPAN'));
  });

  it('copies block number to clipboard and shows feedback', () => {
    const { container } = render(
      <BlockPickerAdvancedItemBlock block={42} blockParts={4} />
    );
    const svg = container.querySelector('svg') as Element;
    fireEvent.click(svg);
    expect(mockCopy).toHaveBeenCalledWith('42');
    expect(screen.getByText('Copied')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });
});
