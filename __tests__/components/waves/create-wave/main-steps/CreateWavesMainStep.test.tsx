import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWavesMainStep from '@/components/waves/create-wave/main-steps/CreateWavesMainStep';
import { CreateWaveStep, CreateWaveStepStatus } from '@/types/waves.types';

jest.mock('@/components/waves/create-wave/main-steps/CreateWavesMainStepIcon', () => () => <div data-testid="icon" />);
jest.mock('@/components/waves/create-wave/main-steps/CreateWavesMainStepConnectionLine', () => () => <div data-testid="line" />);

jest.mock('@/helpers/waves/waves.helpers', () => ({
  getCreateWaveStepStatus: jest.fn(() => CreateWaveStepStatus.DONE),
}));

describe('CreateWavesMainStep', () => {
  it('calls onStep when step is done', async () => {
    const user = userEvent.setup();
    const onStep = jest.fn();
    render(
      <CreateWavesMainStep
        isLast={false}
        label="Step"
        step={CreateWaveStep.OVERVIEW}
        stepIndex={0}
        activeStepIndex={1}
        onStep={onStep}
      />
    );
    await user.click(screen.getByRole('button'));
    expect(onStep).toHaveBeenCalledWith(CreateWaveStep.OVERVIEW);
  });

  it('disables button when not done', () => {
    const helpers = require('@/helpers/waves/waves.helpers');
    helpers.getCreateWaveStepStatus.mockReturnValue(CreateWaveStepStatus.ACTIVE);
    render(
      <CreateWavesMainStep
        isLast={false}
        label="Step"
        step={CreateWaveStep.OVERVIEW}
        stepIndex={0}
        activeStepIndex={0}
        onStep={jest.fn()}
      />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
