import { render, screen, act } from '@testing-library/react';
import DistributionPlanToolConnect from '../../../../components/distribution-plan-tool/connect/distributipn-plan-tool-connect';

jest.mock('../../../../components/distribution-plan-tool/connect/distribution-plan-tool-not-connected', () => () => <div data-testid="not-connected" />);
jest.mock('../../../../components/distribution-plan-tool/connect/distribution-plan-tool-connected', () => () => <div data-testid="connected" />);
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));

import { useSeizeConnectContext } from '../../../../components/auth/SeizeConnectContext';
import * as helpers from '../../../../helpers/AllowlistToolHelpers';

describe('DistributionPlanToolConnect', () => {
  it('renders not connected view when address invalid', async () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: null });
    jest.spyOn(helpers, 'isEthereumAddress').mockReturnValue(false);
    await act(async () => { render(<DistributionPlanToolConnect />); });
    expect(screen.getByTestId('not-connected')).toBeInTheDocument();
  });

  it('renders connected view when address valid', async () => {
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0x1' });
    jest.spyOn(helpers, 'isEthereumAddress').mockReturnValue(true);
    await act(async () => { render(<DistributionPlanToolConnect />); });
    expect(screen.getByTestId('connected')).toBeInTheDocument();
  });
});
