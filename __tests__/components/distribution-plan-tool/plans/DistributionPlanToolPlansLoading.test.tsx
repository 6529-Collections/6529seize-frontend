import React from 'react';
import { render } from '@testing-library/react';
import DistributionPlanToolPlansLoading from '../../../../components/distribution-plan-tool/plans/DistributionPlanToolPlansLoading';
import AllowlistToolLoader from '../../../../components/allowlist-tool/common/AllowlistToolLoader';
import { AllowlistToolLoaderSize } from '../../../../components/allowlist-tool/common/AllowlistToolLoader';

jest.mock('../../../../components/allowlist-tool/common/AllowlistToolLoader', () => {
  const mock = jest.fn(() => <div data-testid="loader" />);
  return {
    __esModule: true,
    default: mock,
    AllowlistToolLoaderSize: { LARGE: 'LARGE' },
  };
});

const loaderMock = AllowlistToolLoader as jest.Mock;

describe('DistributionPlanToolPlansLoading', () => {
  it('renders large loader', () => {
    render(<DistributionPlanToolPlansLoading />);
      expect(loaderMock).toHaveBeenCalledWith({ size: 'LARGE' }, undefined);
  });
});
