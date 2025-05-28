import { render } from '@testing-library/react';
import CreateWaveApproval from '../../../../../components/waves/create-wave/approval/CreateWaveApproval';
import { CREATE_WAVE_VALIDATION_ERROR } from '../../../../../helpers/waves/create-wave.validation';

jest.mock('../../../../../components/waves/create-wave/approval/CreateWaveApprovalThreshold', () => (props: any) => (
  <div data-testid="threshold" data-error={props.error}></div>
));
jest.mock('../../../../../components/waves/create-wave/approval/CreateWaveApprovalThresholdTime', () => (props: any) => (
  <div data-testid="threshold-time" data-error={props.thresholdTimeError} data-duration-error={props.thresholdDurationError}></div>
));

describe('CreateWaveApproval', () => {
  it('forwards error flags to child components', () => {
    const errors = [
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_REQUIRED,
      CREATE_WAVE_VALIDATION_ERROR.APPROVAL_THRESHOLD_TIME_REQUIRED,
    ];
    const { getByTestId } = render(
      <CreateWaveApproval
        threshold={null}
        thresholdTimeMs={null}
        errors={errors}
        setThreshold={() => {}}
        setThresholdTimeMs={() => {}}
      />
    );
    expect(getByTestId('threshold')).toHaveAttribute('data-error', 'true');
    expect(getByTestId('threshold-time')).toHaveAttribute('data-error', 'true');
    expect(getByTestId('threshold-time')).toHaveAttribute('data-duration-error', 'false');
  });
});
