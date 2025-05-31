import { render, screen } from '@testing-library/react';
import CreateWavesMainSteps from '../../../../../components/waves/create-wave/main-steps/CreateWavesMainSteps';
import { ApiWaveType } from '../../../../../generated/models/ApiWaveType';
import { CREATE_WAVE_MAIN_STEPS } from '../../../../../helpers/waves/waves.constants';
import { CreateWaveStep } from '../../../../../types/waves.types';

jest.mock('../../../../../components/waves/create-wave/main-steps/CreateWavesMainStep', () => (props: any) => (
  <div data-testid="step" data-step={props.step}>{props.label}</div>
));

describe('CreateWavesMainSteps', () => {
  it('renders a step component for each configured step', () => {
    render(
      <CreateWavesMainSteps
        waveType={ApiWaveType.Rank}
        activeStep={CreateWaveStep.OVERVIEW}
        onStep={jest.fn()}
      />
    );
    const steps = screen.getAllByTestId('step');
    expect(steps).toHaveLength(CREATE_WAVE_MAIN_STEPS[ApiWaveType.Rank].length);
    expect(steps[0]).toHaveAttribute('data-step', CreateWaveStep.OVERVIEW);
  });
});
