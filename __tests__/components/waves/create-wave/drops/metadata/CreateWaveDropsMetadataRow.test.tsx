import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveDropsMetadataRow from '@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadataRow';
import { ApiWaveMetadataType } from '@/generated/models/ApiWaveMetadataType';

jest.mock('@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadataRowType', () => (props: any) => (
  <div data-testid="type" onClick={() => props.onTypeChange(ApiWaveMetadataType.Number)} />
));

describe('CreateWaveDropsMetadataRow', () => {
  it('calls onItemChange when input changes', async () => {
    const user = userEvent.setup();
    const onItemChange = jest.fn();
    const onItemRemove = jest.fn();
    render(
      <CreateWaveDropsMetadataRow
        item={{ key: 'name', type: ApiWaveMetadataType.String }}
        index={0}
        isNotUnique={true}
        onItemChange={onItemChange}
        onItemRemove={onItemRemove}
      />
    );
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onItemChange).toHaveBeenCalledWith({ index: 0, key: 'namea', type: ApiWaveMetadataType.String });
    await user.click(screen.getByTestId('type'));
    expect(onItemChange).toHaveBeenLastCalledWith(expect.objectContaining({ type: ApiWaveMetadataType.Number }));
    await user.click(screen.getByRole('button', { name: 'Remove item' }));
    expect(onItemRemove).toHaveBeenCalledWith(0);
    expect(screen.getByText('Metadata name must be unique')).toBeInTheDocument();
  });
});
