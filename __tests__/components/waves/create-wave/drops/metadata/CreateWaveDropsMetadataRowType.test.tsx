import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveDropsMetadataRowType from '@/components/waves/create-wave/drops/metadata/CreateWaveDropsMetadataRowType';
import { ApiWaveMetadataType } from '@/generated/models/ApiWaveMetadataType';

describe('CreateWaveDropsMetadataRowType', () => {
  it('calls onTypeChange when buttons clicked', async () => {
    const cb = jest.fn();
    render(<CreateWaveDropsMetadataRowType activeType={ApiWaveMetadataType.String} onTypeChange={cb} />);
    await userEvent.click(screen.getByTitle('Number'));
    expect(cb).toHaveBeenCalledWith(ApiWaveMetadataType.Number);
  });

  it('applies active classes based on activeType', () => {
    render(<CreateWaveDropsMetadataRowType activeType={ApiWaveMetadataType.Number} onTypeChange={jest.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]?.className).toContain('tw-ring-primary-400');
    expect(buttons[0]?.className).not.toContain('tw-ring-primary-400');
  });
});
