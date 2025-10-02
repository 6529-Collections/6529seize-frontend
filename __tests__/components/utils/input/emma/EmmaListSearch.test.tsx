import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import EmmaListSearch from '@/components/utils/input/emma/EmmaListSearch';
import { AllowlistDescription } from '@/helpers/AllowlistToolHelpers';

let receivedProps: any;
jest.mock('@/components/utils/input/emma/EmmaListSearchItems', () => (props: any) => {
  receivedProps = props;
  return <div data-testid="items" />;
});

describe('EmmaListSearch', () => {
  it('opens on focus and selects item', () => {
    const item: AllowlistDescription = { id: '1', name: 'Test' } as any;
    const onSelect = jest.fn();
    const { rerender } = render(<EmmaListSearch selectedId={null} onSelect={onSelect} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(receivedProps.open).toBe(true);

    receivedProps.onSelect(item);
    expect(onSelect).toHaveBeenCalledWith(item);
    
    // Re-render to reflect state changes
    rerender(<EmmaListSearch selectedId={null} onSelect={onSelect} />);
    expect((input as HTMLInputElement).value).toBe('Test');
    expect(receivedProps.open).toBe(false);
  });
});
