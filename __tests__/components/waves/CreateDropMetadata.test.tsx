import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateDropMetadata from '../../../components/waves/CreateDropMetadata';

jest.mock('../../../components/waves/CreateDropMetadataRow', () => ({
  __esModule: true,
  default: ({ index }: any) => <div data-testid="row">row-{index}</div>,
}));

describe('CreateDropMetadata', () => {
  const base = { key: 'k', value: 'v' } as any;

  it('renders rows and triggers actions', () => {
    const close = jest.fn();
    const onAdd = jest.fn();
    render(
      <CreateDropMetadata
        metadata={[base, base]}
        missingRequiredMetadataKeys={[]}
        disabled={false}
        closeMetadata={close}
        onChangeKey={jest.fn()}
        onChangeValue={jest.fn()}
        onAddMetadata={onAdd}
        onRemoveMetadata={jest.fn()}
      />
    );
    expect(screen.getAllByTestId('row')).toHaveLength(2);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(close).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Add new'));
    expect(onAdd).toHaveBeenCalled();
  });
});
