import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import NegativeVotingToggle from '../../../../../components/waves/create-wave/voting/NegativeVotingToggle';

test('does not call onChange when disabled', () => {
  const onChange = jest.fn();
  render(<NegativeVotingToggle allowNegativeVotes={false} onChange={onChange} isDisabled />);
  fireEvent.click(screen.getByRole('checkbox'));
  expect(onChange).not.toHaveBeenCalled();
});

test('toggles value when enabled', () => {
  const onChange = jest.fn();
  render(<NegativeVotingToggle allowNegativeVotes={false} onChange={onChange} isDisabled={false} />);
  fireEvent.click(screen.getByRole('checkbox'));
  expect(onChange).toHaveBeenCalledWith(true);
});
