import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import WaveGroupRemoveModal from '../../../../../../../components/waves/specs/groups/group/edit/WaveGroupRemoveModal';

jest.mock('react-dom', () => ({ ...jest.requireActual('react-dom'), createPortal: (node: any) => node }));
jest.mock('react-use', () => ({ useClickAway: (_ref: any, fn: any) => {}, useKeyPressEvent: (_k: any, fn: any) => {} }));

it('calls handlers on actions', () => {
  const close = jest.fn();
  const remove = jest.fn();
  render(<WaveGroupRemoveModal closeModal={close} removeGroup={remove} />);
  fireEvent.click(screen.getByText('Remove'));
  expect(remove).toHaveBeenCalled();
  fireEvent.click(screen.getByText('Cancel'));
  expect(close).toHaveBeenCalled();
});
