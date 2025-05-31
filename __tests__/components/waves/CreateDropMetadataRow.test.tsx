import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CreateDropMetadataRow from '../../../components/waves/CreateDropMetadataRow';

const baseMeta = { key: 'a', value: '1', type: 'TEXT', required: false } as any;

test('calls handlers for key and value changes', () => {
  const onKey = jest.fn();
  const onValue = jest.fn();
  render(
    <CreateDropMetadataRow
      metadata={baseMeta}
      index={0}
      onChangeKey={onKey}
      onChangeValue={onValue}
      onRemove={jest.fn()}
      isError={false}
      disabled={false}
    />
  );
  fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'x' } });
  expect(onKey).toHaveBeenCalledWith({ index: 0, newKey: 'x' });
  fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'foo' } });
  expect(onValue).toHaveBeenCalledWith({ index: 0, newValue: 'foo' });
});

test('handles numeric value parsing', () => {
  const onValue = jest.fn();
  render(
    <CreateDropMetadataRow
      metadata={{ ...baseMeta, type: 'NUMBER', value: 2 }}
      index={1}
      onChangeKey={jest.fn()}
      onChangeValue={onValue}
      onRemove={jest.fn()}
      isError={false}
      disabled={false}
    />
  );
  const input = screen.getAllByRole('textbox')[1];
  fireEvent.change(input, { target: { value: '3' } });
  expect(onValue).toHaveBeenCalledWith({ index: 1, newValue: 3 });
  fireEvent.change(input, { target: { value: '-' } });
  expect(onValue).toHaveBeenCalledWith({ index: 1, newValue: null });
});
