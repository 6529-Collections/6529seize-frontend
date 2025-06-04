import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveDropsTypes, { ExtendedWaveParticipationRequirement } from '../../../../../../components/waves/create-wave/drops/types/CreateWaveDropsTypes';
import { ApiWaveParticipationRequirement } from '../../../../../../generated/models/ApiWaveParticipationRequirement';

describe('CreateWaveDropsTypes', () => {
  it('emits selected type on click', async () => {
    const onChange = jest.fn();
    render(<CreateWaveDropsTypes requiredTypes={[]} onRequiredTypeChange={onChange} />);
    const image = screen.getByText('Image').closest('div') as HTMLElement;
    await userEvent.click(image);
    expect(onChange).toHaveBeenCalledWith([ApiWaveParticipationRequirement.Image]);
  });

  it('selects none when none clicked', async () => {
    const onChange = jest.fn();
    render(<CreateWaveDropsTypes requiredTypes={[ApiWaveParticipationRequirement.Image]} onRequiredTypeChange={onChange} />);
    const none = screen.getByText('None').closest('div') as HTMLElement;
    await userEvent.click(none);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
