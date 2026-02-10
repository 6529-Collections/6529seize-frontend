import { render, screen, fireEvent } from '@testing-library/react';
import CreateWaveDropsType from '@/components/waves/create-wave/drops/types/CreateWaveDropsType';
import { ExtendedWaveParticipationRequirement } from '@/components/waves/create-wave/drops/types/CreateWaveDropsTypes';

describe('CreateWaveDropsType', () => {
  it('calls change handler when clicked', () => {
    const onChange = jest.fn();
    render(
      <CreateWaveDropsType
        isChecked={false}
        type={ExtendedWaveParticipationRequirement.IMAGE}
        onRequiredTypeChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(ExtendedWaveParticipationRequirement.IMAGE);
  });

  it('displays label and checked state', () => {
    const { container } = render(
      <CreateWaveDropsType
        isChecked={true}
        type={ExtendedWaveParticipationRequirement.AUDIO}
        onRequiredTypeChange={() => {}}
      />
    );
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeChecked();
    expect(screen.getByText('Audio')).toBeInTheDocument();
  });
});
