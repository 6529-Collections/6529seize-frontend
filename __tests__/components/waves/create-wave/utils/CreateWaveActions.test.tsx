import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateWaveActions from '../../../../../components/waves/create-wave/utils/CreateWaveActions';
import { CreateWaveStep } from '../../../../../types/waves.types';

jest.mock('../../../../../components/waves/create-wave/utils/CreateWaveBackStep', () => (props: any) => (
  <button data-testid="back" onClick={props.onPreviousStep}>back</button>
));
jest.mock('../../../../../components/waves/create-wave/utils/CreateWaveNextStep', () => (props: any) => (
  <button data-testid="next" onClick={props.onClick} disabled={props.disabled}>next</button>
));

jest.mock('../../../../../helpers/waves/create-wave.helpers', () => ({
  getCreateWaveNextStep: jest.fn(() => CreateWaveStep.DATES),
  getCreateWavePreviousStep: jest.fn(() => CreateWaveStep.OVERVIEW),
}));

describe('CreateWaveActions', () => {
  const config: any = { overview: { type: 'Rank' } };

  it('navigates to next step', async () => {
    const user = userEvent.setup();
    const setStep = jest.fn();
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.GROUPS}
        submitting={false}
        setStep={setStep}
        onComplete={jest.fn()}
      />
    );
    await user.click(screen.getByTestId('next'));
    expect(setStep).toHaveBeenCalledWith(CreateWaveStep.DATES, 'forward');
  });

  it('calls onComplete when no next step', async () => {
    const helpers = require('../../../../../helpers/waves/create-wave.helpers');
    helpers.getCreateWaveNextStep.mockReturnValue(null);
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.DESCRIPTION}
        submitting={false}
        setStep={jest.fn()}
        onComplete={onComplete}
      />
    );
    await user.click(screen.getByTestId('next'));
    expect(onComplete).toHaveBeenCalled();
  });

  it('renders back step when previous exists', () => {
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.GROUPS}
        submitting={false}
        setStep={jest.fn()}
        onComplete={jest.fn()}
      />
    );
    expect(screen.getByTestId('back')).toBeInTheDocument();
  });
});
