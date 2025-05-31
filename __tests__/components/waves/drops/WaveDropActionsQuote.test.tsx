import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import WaveDropActionsQuote from '../../../../components/waves/drops/WaveDropActionsQuote';

jest.mock('@tippyjs/react', () => ({ __esModule: true, default: ({ children, disabled }: any) => <div data-disabled={disabled}>{children}</div> }));

describe('WaveDropActionsQuote', () => {
  const baseDrop: any = { id: '1', wave: { authenticated_user_eligible_to_chat: true } };
  it('calls handler when allowed', () => {
    const onQuote = jest.fn();
    const { getByRole } = render(<WaveDropActionsQuote drop={baseDrop} onQuote={onQuote} activePartIndex={0} />);
    fireEvent.click(getByRole('button'));
    expect(onQuote).toHaveBeenCalled();
  });

  it('disables button for temporary drop', () => {
    const drop = { ...baseDrop, id: 'temp-1' };
    const { getByRole, container } = render(<WaveDropActionsQuote drop={drop} onQuote={jest.fn()} activePartIndex={0} />);
    expect(getByRole('button')).toBeDisabled();
    expect(container.querySelector('[data-disabled="true"]')).toBeTruthy();
  });
});
