import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveDropsMetadataAddRowButton from '@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadataAddRowButton';

describe('CreateWaveDropsMetadataAddRowButton', () => {
  it('renders "Add" when no items and calls handler', async () => {
    const cb = jest.fn();
    render(<CreateWaveDropsMetadataAddRowButton itemsCount={0} onAddNewRow={cb} />);
    expect(screen.getByText('Add')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(cb).toHaveBeenCalled();
  });

  it('renders "Add more" when items exist', () => {
    const cb = jest.fn();
    render(<CreateWaveDropsMetadataAddRowButton itemsCount={2} onAddNewRow={cb} />);
    expect(screen.getByText('Add more')).toBeInTheDocument();
  });
});
