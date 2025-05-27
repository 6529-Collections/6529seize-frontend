import React from 'react';
import { render } from '@testing-library/react';
import DistributionPlanToolWrapper from '../../../../components/distribution-plan-tool/wrapper/DistributionPlanToolWrapper';
import { AuthContext } from '../../../../components/auth/Auth';

jest.mock('next/font/google', () => ({ Poppins: () => ({ className: 'poppins' }) }));
jest.mock('next/router', () => ({ useRouter: jest.fn() }));
jest.mock('../../../../components/auth/SeizeConnectContext', () => ({ useSeizeConnectContext: jest.fn() }));

const { useRouter } = require('next/router');
const { useSeizeConnectContext } = require('../../../../components/auth/SeizeConnectContext');

function renderWrapper(address?: string) {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({ push });
  (useSeizeConnectContext as jest.Mock).mockReturnValue({ address });
  const setTitle = jest.fn();
  const result = render(
    <AuthContext.Provider value={{ setTitle } as any}>
      <DistributionPlanToolWrapper>
        <div data-testid="child" />
      </DistributionPlanToolWrapper>
    </AuthContext.Provider>
  );
  return { push, setTitle, ...result };
}

describe('DistributionPlanToolWrapper', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets title on mount', () => {
    const { setTitle } = renderWrapper();
    expect(setTitle).toHaveBeenCalledWith({ title: 'EMMA | Tools' });
  });

  it('redirects to /emma when address changes', () => {
    const { rerender, push } = renderWrapper();
    (useSeizeConnectContext as jest.Mock).mockReturnValue({ address: '0xabc' });
    rerender(
      <AuthContext.Provider value={{ setTitle: jest.fn() } as any}>
        <DistributionPlanToolWrapper>
          <div />
        </DistributionPlanToolWrapper>
      </AuthContext.Provider>
    );
    expect(push).toHaveBeenCalledWith('/emma');
  });
});
